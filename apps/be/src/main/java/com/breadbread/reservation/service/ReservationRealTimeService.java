package com.breadbread.reservation.service;

import com.breadbread.global.exception.CustomException;
import com.breadbread.global.exception.ErrorCode;
import com.breadbread.notification.service.FcmService;
import com.breadbread.reservation.entity.Reservation;
import com.breadbread.reservation.entity.ReservationStatus;
import com.breadbread.reservation.repository.ReservationRepository;
import com.breadbread.tour.service.CooldownRedisService;
import com.breadbread.tour.service.TourRedisService;
import com.breadbread.tour.service.TourService;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReservationRealTimeService {

    private final ReservationRepository reservationRepository;
    private final CooldownRedisService cooldownRedisService;
    private final FcmService fcmService;
    private final TourService tourService;
    private final TourRedisService tourRedisService;

    /** 매시간 0분/30분 실행 — 1시간 전 알림 + tourService.startTour 호출 */
    @Transactional
    public void processHourlyEvents() {
        ZoneId seoul = ZoneId.of("Asia/Seoul");
        LocalDate today = LocalDate.now(seoul);
        LocalTime now = LocalTime.now(seoul);

        List<Reservation> todayConfirmed = fetchTodayConfirmed(today);
        if (todayConfirmed.isEmpty()) return;

        for (Reservation reservation : todayConfirmed) {
            long minutesUntil = minutesUntil(today, now, reservation.getDepartureTime());
            notifyOneHourBefore(reservation, minutesUntil);
            startTourAtDeparture(reservation, minutesUntil);
        }
    }

    /** 매시간 20분/50분 실행 — 10분 전 알림 */
    @Transactional
    public void processTenMinEvents() {
        ZoneId seoul = ZoneId.of("Asia/Seoul");
        LocalDate today = LocalDate.now(seoul);
        LocalTime now = LocalTime.now(seoul);

        List<Reservation> todayConfirmed = fetchTodayConfirmed(today);
        if (todayConfirmed.isEmpty()) return;

        for (Reservation reservation : todayConfirmed) {
            long minutesUntil = minutesUntil(today, now, reservation.getDepartureTime());
            notifyTenMinBefore(reservation, minutesUntil);
        }
    }

    private void notifyOneHourBefore(Reservation reservation, long minutesUntil) {
        if (minutesUntil < 58 || minutesUntil > 62) return;

        Long userId = reservation.getUser().getId();
        Long reservationId = reservation.getId();
        if (!cooldownRedisService.tryMarkOneHourBeforeNotified(userId, reservationId)) return;

        fcmService.sendToUser(
                userId,
                "투어 1시간 전 알림",
                reservation.getCourseNameSnapshot() + " 코스 출발 1시간 전입니다. 준비하세요!",
                Map.of(
                        "type", "ONE_HOUR_BEFORE",
                        "courseId", String.valueOf(reservation.getCourse().getId()),
                        "reservationId", String.valueOf(reservationId)));

        log.info("[1시간 전 알림] 발송: userId={}, reservationId={}", userId, reservationId);
    }

    private void notifyTenMinBefore(Reservation reservation, long minutesUntil) {
        if (minutesUntil < 8 || minutesUntil > 12) return;

        Long userId = reservation.getUser().getId();
        Long reservationId = reservation.getId();
        if (!cooldownRedisService.tryMarkTenMinBeforeNotified(userId, reservationId)) return;

        fcmService.sendToUser(
                userId,
                "투어 10분 전 알림",
                reservation.getCourseNameSnapshot() + " 코스 출발 10분 전입니다!",
                Map.of(
                        "type", "TEN_MIN_BEFORE",
                        "courseId", String.valueOf(reservation.getCourse().getId()),
                        "reservationId", String.valueOf(reservationId)));

        log.info("[10분 전 알림] 발송: userId={}, reservationId={}", userId, reservationId);
    }

    private void startTourAtDeparture(Reservation reservation, long minutesUntil) {
        if (minutesUntil < -5 || minutesUntil > 5) return;

        Long userId = reservation.getUser().getId();
        Long reservationId = reservation.getId();
        Long courseId = reservation.getCourse().getId();

        if (!cooldownRedisService.tryMarkTourStartNotified(userId, reservationId)) return;

        try {
            tourService.startTour(userId, reservation.getUser().getRole(), courseId);
        } catch (CustomException e) {
            if (e.getErrorCode() == ErrorCode.TOUR_ALREADY_STARTED) {
                boolean sameCourseTourActive =
                        tourRedisService
                                .getTourState(userId)
                                .map(state -> state.getCourseId().equals(courseId))
                                .orElse(false);
                if (!sameCourseTourActive) {
                    // 다른 코스 투어가 진행 중 — 재시도 가능하도록 Redis 키 삭제
                    cooldownRedisService.deleteTourStartMark(userId, reservationId);
                    log.warn(
                            "[투어 시작] 다른 투어 진행 중으로 시작 불가: userId={}, reservationId={}",
                            userId,
                            reservationId);
                }
                // 같은 코스라면 사용자가 직접 시작한 것으로 간주 — tryMark 상태 유지
            } else {
                cooldownRedisService.deleteTourStartMark(userId, reservationId);
                log.warn(
                        "[투어 시작] 실패: userId={}, reservationId={}, error={}",
                        userId,
                        reservationId,
                        e.getMessage());
            }
            return;
        }

        fcmService.sendToUser(
                userId,
                "투어 시작",
                reservation.getCourseNameSnapshot() + " 코스가 시작되었습니다! 즐거운 빵집 투어 되세요!",
                Map.of(
                        "type", "TOUR_START",
                        "courseId", String.valueOf(courseId),
                        "reservationId", String.valueOf(reservationId)));

        log.info("[투어 시작] reservationId={}, userId={}", reservationId, userId);
    }

    private List<Reservation> fetchTodayConfirmed(LocalDate today) {
        return reservationRepository.findTodayConfirmedWithCourse(
                today, ReservationStatus.CONFIRMED);
    }

    private long minutesUntil(LocalDate today, LocalTime now, LocalTime departureTime) {
        return Duration.between(
                        LocalDateTime.of(today, now), LocalDateTime.of(today, departureTime))
                .toMinutes();
    }
}
