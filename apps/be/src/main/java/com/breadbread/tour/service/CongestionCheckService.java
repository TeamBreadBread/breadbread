package com.breadbread.tour.service;

import com.breadbread.bakery.entity.DayType;
import com.breadbread.global.exception.CustomException;
import com.breadbread.notification.service.FcmService;
import com.breadbread.reservation.entity.Reservation;
import com.breadbread.reservation.entity.ReservationStatus;
import com.breadbread.reservation.repository.ReservationRepository;
import com.breadbread.tour.client.CongestionAlertWebhookClient;
import com.breadbread.tour.dto.CongestionAlertWebhookRequest;
import com.breadbread.tour.dto.CongestionAlertWebhookResponse;
import com.breadbread.tour.redis.TourStateCache;
import com.breadbread.tour.redis.TourStatus;
import com.breadbread.user.entity.UserRole;
import com.breadbread.user.repository.UserRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class CongestionCheckService {

    private final TourRedisService tourRedisService;
    private final CooldownRedisService cooldownRedisService;
    private final CongestionCheckQueryService queryService;
    private final CongestionAlertWebhookClient webhookClient;
    private final FcmService fcmService;
    private final ObjectMapper objectMapper;
    private final ReservationRepository reservationRepository;
    private final UserRepository userRepository;

    public void checkAndNotify() {
        ZoneId seoul = ZoneId.of("Asia/Seoul");
        LocalDate today = LocalDate.now(seoul);
        DayType dayType = resolveDayType(today.getDayOfWeek());
        LocalTime now = LocalTime.now(seoul);

        List<Long> activeUserIds = tourRedisService.getAllActiveUserIds();
        if (!activeUserIds.isEmpty()) {
            log.info("[혼잡도 체크] 활성 투어 사용자 수: {}", activeUserIds.size());
            for (Long userId : activeUserIds) {
                try {
                    processUser(userId, dayType, now);
                } catch (Exception e) {
                    log.warn("[혼잡도 체크] userId={} 처리 중 오류: {}", userId, e.getMessage(), e);
                }
            }
        }

        checkPreTourCongestion(today, dayType, now);
    }

    private void processUser(Long userId, DayType dayType, LocalTime now) {
        tourRedisService.getTourState(userId).ifPresent(state -> processState(state, dayType, now));
    }

    // FCM을 실제로 전송했으면 true 반환
    private boolean processState(TourStateCache state, DayType dayType, LocalTime now) {
        Long userId = state.getUserId();

        Optional<CongestionCheckQueryService.CheckData> dataOpt =
                queryService.loadCheckData(state, dayType, now);
        if (dataOpt.isEmpty()) return false;
        CongestionCheckQueryService.CheckData data = dataOpt.get();

        List<Long> unprocessed =
                data.candidateBakeryIds().stream()
                        .filter(bakeryId -> !cooldownRedisService.isOnCooldown(userId, bakeryId))
                        .toList();
        if (unprocessed.isEmpty()) return false;

        // 후보가 있을 때만 락 획득 (락 불필요한 경우 120초 점유 방지)
        if (!cooldownRedisService.tryAcquireProcessingLock(userId)) return false;

        // 락 획득 후 재확인 — 다른 인스턴스가 먼저 처리했을 수 있음
        List<Long> stillUnprocessed =
                unprocessed.stream()
                        .filter(bakeryId -> !cooldownRedisService.isOnCooldown(userId, bakeryId))
                        .toList();
        if (stillUnprocessed.isEmpty()) return false;

        log.info("[혼잡도 체크] 미처리 혼잡 후보 감지: userId={}, bakeryIds={}", userId, stillUnprocessed);

        CongestionAlertWebhookResponse response;
        try {
            response = webhookClient.requestAlert(data.webhookRequest());
        } catch (CustomException e) {
            log.warn("[혼잡도 체크] 웹훅 호출 실패 — FCM 전송 생략: userId={}, error={}", userId, e.getMessage());
            return false;
        } catch (Exception e) {
            log.warn(
                    "[혼잡도 체크] 웹훅 호출 중 예외 — FCM 전송 생략: userId={}, error={}",
                    userId,
                    e.getMessage(),
                    e);
            return false;
        }

        CongestionAlertWebhookResponse.SuggestionData suggestionData = response.getData();
        String title =
                (suggestionData != null && suggestionData.getTitle() != null)
                        ? suggestionData.getTitle()
                        : "빵집 혼잡도 알림";
        String message =
                (suggestionData != null && suggestionData.getMessage() != null)
                        ? suggestionData.getMessage()
                        : "방문 예정 빵집이 혼잡합니다.";

        boolean sent =
                fcmService.sendToUserSync(
                        userId, title, message, buildFcmData(response, state.getCourseId()));
        if (sent) {
            stillUnprocessed.forEach(
                    bakeryId -> cooldownRedisService.markAttempted(userId, bakeryId));
            log.info("[혼잡도 체크] 처리 완료: userId={}, courseId={}", userId, state.getCourseId());
        }
        return sent;
    }

    // 활성 투어 사용자는 processUser에서 이미 처리하므로 제외
    private void checkPreTourCongestion(LocalDate today, DayType dayType, LocalTime now) {
        LocalTime windowEnd = now.plusHours(2);

        List<Reservation> upcoming =
                reservationRepository.findTodayConfirmedWithCourse(
                        today, ReservationStatus.CONFIRMED);

        if (upcoming.isEmpty()) return;
        log.info("[혼잡도 체크] 출발 전 대상 예약 수: {}", upcoming.size());
        for (Reservation reservation : upcoming) {
            LocalTime departureTime = reservation.getDepartureTime();
            if (departureTime.isBefore(now) || departureTime.isAfter(windowEnd)) continue;

            Long userId = reservation.getUser().getId();
            Long reservationId = reservation.getId();

            if (tourRedisService.getTourState(userId).isPresent()) continue;
            if (cooldownRedisService.isPreDepartureCongestionChecked(userId, reservationId))
                continue;
            log.info(
                    "[혼잡도 체크] 출발 전 혼잡도 체크 시작: userId={}, reservationId={}, departureTime={}",
                    userId,
                    reservationId,
                    departureTime);

            TourStateCache syntheticState =
                    TourStateCache.builder()
                            .userId(userId)
                            .courseId(reservation.getCourse().getId())
                            .totalBakeryCount(reservation.getCourse().getCourseBakeries().size())
                            .currentVisitOrder(0)
                            .status(TourStatus.IN_PROGRESS)
                            .startedAt(departureTime.toString())
                            .build();

            try {
                boolean sent = processState(syntheticState, dayType, departureTime);
                if (sent)
                    cooldownRedisService.markPreDepartureCongestionChecked(userId, reservationId);
            } catch (Exception e) {
                log.warn("[혼잡도 체크] 출발 전 사용자 처리 중 오류: userId={}, {}", userId, e.getMessage(), e);
            }
        }
    }

    public CongestionAlertWebhookResponse testWebhook(Long userId, Long courseId) {
        Optional<TourStateCache> activeTourState = tourRedisService.getTourState(userId);
        CongestionAlertWebhookRequest request =
                queryService.loadTestData(userId, courseId, activeTourState);
        CongestionAlertWebhookResponse response = webhookClient.requestAlert(request);

        if (userRepository.existsByIdAndRole(userId, UserRole.ROLE_ADMIN)) {
            CongestionAlertWebhookResponse.SuggestionData data = response.getData();
            String title =
                    (data != null && data.getTitle() != null) ? data.getTitle() : "빵집 혼잡도 알림";
            String message =
                    (data != null && data.getMessage() != null)
                            ? data.getMessage()
                            : "방문 예정 빵집이 혼잡합니다.";
            fcmService.sendToUser(userId, title, message, buildFcmData(response, courseId));
        }

        return response;
    }

    private Map<String, String> buildFcmData(
            CongestionAlertWebhookResponse response, Long courseId) {
        Map<String, String> fcmData = new HashMap<>();
        fcmData.put("courseId", String.valueOf(courseId));

        CongestionAlertWebhookResponse.SuggestionData data = response.getData();
        if (data == null) return fcmData;

        if (data.getType() != null) fcmData.put("type", data.getType());
        if (data.getRecommendedAction() != null)
            fcmData.put("recommendedAction", data.getRecommendedAction());
        try {
            if (data.getNewBakeryOrder() != null)
                fcmData.put(
                        "newBakeryOrder",
                        objectMapper.writeValueAsString(data.getNewBakeryOrder()));
            if (data.getReasons() != null)
                fcmData.put("reasons", objectMapper.writeValueAsString(data.getReasons()));
            if (data.getButtons() != null)
                fcmData.put("buttons", objectMapper.writeValueAsString(data.getButtons()));
        } catch (JsonProcessingException e) {
            log.warn("[혼잡도 체크] FCM data 직렬화 일부 실패: {}", e.getMessage());
        }
        return fcmData;
    }

    private DayType resolveDayType(DayOfWeek dayOfWeek) {
        return (dayOfWeek == DayOfWeek.SATURDAY || dayOfWeek == DayOfWeek.SUNDAY)
                ? DayType.WEEKEND
                : DayType.WEEKDAY;
    }
}
