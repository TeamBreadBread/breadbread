package com.breadbread.course.service.ai;

import com.breadbread.bakery.dto.response.BakeryAiResponse;
import com.breadbread.bakery.entity.Bakery;
import com.breadbread.bakery.entity.Bread;
import com.breadbread.bakery.entity.CrowdTime;
import com.breadbread.bakery.entity.enums.BakeryStatus;
import com.breadbread.bakery.repository.BakeryRepository;
import com.breadbread.bakery.repository.BreadRepository;
import com.breadbread.bakery.repository.CrowdTimeRepository;
import com.breadbread.course.client.AiWebhookClient;
import com.breadbread.course.dto.ai.AiCourseRequest;
import com.breadbread.course.dto.ai.AiCourseWebhookRequest;
import com.breadbread.course.dto.ai.AiCourseWebhookResponse;
import com.breadbread.global.exception.CustomException;
import com.breadbread.global.exception.ErrorCode;
import com.breadbread.global.util.GeoDistance;
import com.breadbread.notification.service.FcmService;
import com.breadbread.user.dto.PreferenceResponse;
import com.breadbread.user.entity.UserPreference;
import com.breadbread.user.repository.UserPreferenceRepository;
import com.breadbread.user.repository.UserRepository;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiCourseAsyncService {

    private static final int AI_BAKERY_CANDIDATE_LIMIT = 40;

    private final UserRepository userRepository;
    private final UserPreferenceRepository userPreferenceRepository;
    private final BakeryRepository bakeryRepository;
    private final BreadRepository breadRepository;
    private final CrowdTimeRepository crowdTimeRepository;
    private final AiWebhookClient aiWebhookClient;
    private final AiCourseRedisService aiCourseRedisService;
    private final AiCourseResultRedisService aiCourseResultRedisService;
    private final TransactionTemplate transactionTemplate;
    private final FcmService fcmService;

    @Async("asyncTaskExecutor")
    public CompletableFuture<Void> processAiCourse(
            String jobId, Long userId, AiCourseRequest request) {
        try {
            log.info("[AI 코스 생성] 시작: jobId={}, userId={}", jobId, userId);

            // 1. 읽기 트랜잭션: lazy 컬렉션 포함 전체 데이터 로드 + DTO 변환까지 트랜잭션 안에서 완료
            AiCourseWebhookRequest webhookRequest =
                    transactionTemplate.execute(
                            status -> {
                                userRepository
                                        .findById(userId)
                                        .orElseThrow(
                                                () ->
                                                        new CustomException(
                                                                ErrorCode.USER_NOT_FOUND));
                                UserPreference userPreference =
                                        userPreferenceRepository
                                                .findByUserId(userId)
                                                .orElseThrow(
                                                        () ->
                                                                new CustomException(
                                                                        ErrorCode
                                                                                .PREFERENCE_NOT_FOUND));

                                List<Bakery> bakeries =
                                        bakeryRepository.findAllByActiveTrueAndStatus(
                                                BakeryStatus.APPROVED);
                                List<Bakery> candidateBakeries =
                                        selectBakeriesNearDeparture(bakeries, request);
                                List<Long> ids =
                                        candidateBakeries.stream().map(Bakery::getId).toList();
                                Map<Long, List<Bread>> breadMap =
                                        breadRepository.findAllByBakeryIdIn(ids).stream()
                                                .collect(
                                                        Collectors.groupingBy(
                                                                b -> b.getBakery().getId()));
                                Map<Long, List<CrowdTime>> crowdTimeMap =
                                        crowdTimeRepository.findAllByBakeryIdIn(ids).stream()
                                                .collect(
                                                        Collectors.groupingBy(
                                                                ct -> ct.getBakery().getId()));

                                List<BakeryAiResponse> bakeryAiResponses =
                                        candidateBakeries.stream()
                                                .map(
                                                        b ->
                                                                BakeryAiResponse.from(
                                                                        b,
                                                                        breadMap.getOrDefault(
                                                                                b.getId(),
                                                                                List.of()),
                                                                        crowdTimeMap.getOrDefault(
                                                                                b.getId(),
                                                                                List.of()),
                                                                        null))
                                                .toList();

                                return AiCourseWebhookRequest.builder()
                                        .userPreference(PreferenceResponse.from(userPreference))
                                        .aiCourseRequest(request)
                                        .bakeries(bakeryAiResponses)
                                        .build();
                            });

            // 2. AI 웹훅 호출 (트랜잭션 밖, 약 20초 소요)
            AiCourseWebhookResponse response = aiWebhookClient.requestCourse(jobId, webhookRequest);

            if (response == null
                    || response.getName() == null
                    || response.getEstimatedCost() == null
                    || response.getEstimatedTime() == null
                    || response.getBakeries() == null
                    || response.getBakeries().isEmpty()) {
                log.error("[AI 코스 생성] 응답 필드 누락 jobId={}", jobId);
                aiCourseRedisService.saveFailed(jobId, "AI 응답 데이터가 올바르지 않습니다.");
                return CompletableFuture.completedFuture(null);
            }

            // 3. AI 응답을 Redis에 임시 저장 (TTL 24시간)
            aiCourseResultRedisService.saveResult(jobId, userId, request, response);

            // 4. Redis 상태 COMPLETED로 업데이트
            aiCourseRedisService.saveCompleted(jobId);
            log.info("[AI 코스 생성] 완료 (Redis 임시 저장): jobId={}", jobId);

            // 5. FCM 알림 (실패해도 AI 작업 결과에 영향 없음)
            try {
                String courseName = AiCourseNameResolver.resolve(response);
                fcmService.sendToUser(
                        userId,
                        "AI 코스 추천 완료 ✨",
                        courseName + " 코스 추천이 완료됐습니다. 확인하고 저장해보세요!",
                        Map.of("type", "AI_COURSE_READY", "jobId", jobId));
            } catch (Exception fcmEx) {
                log.warn("[AI 코스 생성] FCM 알림 실패 (작업은 정상 완료): jobId={}", jobId, fcmEx);
            }

        } catch (CustomException e) {
            log.error("[AI 코스 생성] 실패 jobId={}", jobId, e);
            aiCourseRedisService.saveFailed(jobId, e.getMessage());
        } catch (Exception e) {
            log.error("[AI 코스 생성] 예외 발생 jobId={}", jobId, e);
            aiCourseRedisService.saveFailed(jobId, ErrorCode.AI_SERVER_ERROR.getMessage());
        }
        return CompletableFuture.completedFuture(null);
    }

    /** 출발지에서 가까운 빵집만 AI 후보로 전달해 먼 지역(예: 유성구) 추천을 줄인다. */
    private List<Bakery> selectBakeriesNearDeparture(
            List<Bakery> bakeries, AiCourseRequest request) {
        double departureLat = request.getLatitude();
        double departureLng = request.getLongitude();
        List<Bakery> sorted =
                bakeries.stream()
                        .filter(
                                bakery ->
                                        GeoDistance.isValidCoordinate(
                                                bakery.getLatitude(), bakery.getLongitude()))
                        .sorted(
                                Comparator.comparingDouble(
                                        bakery ->
                                                GeoDistance.metersBetween(
                                                        departureLat,
                                                        departureLng,
                                                        bakery.getLatitude(),
                                                        bakery.getLongitude())))
                        .limit(AI_BAKERY_CANDIDATE_LIMIT)
                        .toList();
        return sorted.isEmpty() ? bakeries : sorted;
    }
}
