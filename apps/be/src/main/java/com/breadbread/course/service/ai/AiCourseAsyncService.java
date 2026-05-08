package com.breadbread.course.service.ai;

import com.breadbread.bakery.dto.BakeryAiResponse;
import com.breadbread.bakery.entity.Bakery;
import com.breadbread.bakery.entity.Bread;
import com.breadbread.bakery.entity.CrowdTime;
import com.breadbread.bakery.repository.BakeryRepository;
import com.breadbread.bakery.repository.BreadRepository;
import com.breadbread.bakery.repository.CrowdTimeRepository;
import com.breadbread.course.client.AiWebhookClient;
import com.breadbread.course.dto.ai.AiCourseRequest;
import com.breadbread.course.dto.ai.AiCourseWebhookRequest;
import com.breadbread.course.dto.ai.AiCourseWebhookResponse;
import com.breadbread.course.dto.ai.RecommendedBakeryResponse;
import com.breadbread.course.entity.*;
import com.breadbread.course.repository.CourseRepository;
import com.breadbread.global.exception.CustomException;
import com.breadbread.global.exception.ErrorCode;
import com.breadbread.user.dto.PreferenceResponse;
import com.breadbread.user.entity.User;
import com.breadbread.user.entity.UserPreference;
import com.breadbread.user.repository.UserPreferenceRepository;
import com.breadbread.user.repository.UserRepository;
import java.util.*;
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

    private final UserRepository userRepository;
    private final UserPreferenceRepository userPreferenceRepository;
    private final BakeryRepository bakeryRepository;
    private final BreadRepository breadRepository;
    private final CrowdTimeRepository crowdTimeRepository;
    private final AiWebhookClient aiWebhookClient;
    private final CourseRepository courseRepository;
    private final AiCourseRedisService aiCourseRedisService;
    private final TransactionTemplate transactionTemplate;

    @Async("aiTaskExecutor")
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

                                List<Bakery> bakeries = bakeryRepository.findAll();
                                List<Long> ids = bakeries.stream().map(Bakery::getId).toList();
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

                                // BakeryAiResponse.from() 내부의 모든 lazy 필드 접근이 트랜잭션 안에서 일어남
                                List<BakeryAiResponse> bakeryAiResponses =
                                        bakeries.stream()
                                                .map(
                                                        b ->
                                                                BakeryAiResponse.from(
                                                                        b,
                                                                        breadMap.getOrDefault(
                                                                                b.getId(),
                                                                                List.of()),
                                                                        crowdTimeMap.getOrDefault(
                                                                                b.getId(),
                                                                                List.of())))
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

            // 3. 쓰기 트랜잭션: DB 저장 — 실패 시 롤백 후 예외 전파
            Long courseId =
                    transactionTemplate.execute(
                            status -> {
                                User user =
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

                                List<Long> recommendedIds =
                                        response.getBakeries().stream()
                                                .map(RecommendedBakeryResponse::getId)
                                                .toList();
                                Map<Long, Bakery> bakeryMap =
                                        bakeryRepository.findAllById(recommendedIds).stream()
                                                .collect(Collectors.toMap(Bakery::getId, b -> b));

                                if (bakeryMap.size() != recommendedIds.size()) {
                                    log.error("[AI 코스 생성] DB에 없는 빵집 ID 포함 jobId={}", jobId);
                                    throw new CustomException(ErrorCode.AI_SERVER_ERROR);
                                }

                                AiCourseInfo aiCourseInfo =
                                        AiCourseInfo.builder()
                                                .travelType(request.getTravelType())
                                                .budgetRange(request.getBudgetRange())
                                                .minimizeRoute(request.isMinimizeRoute())
                                                .latitude(request.getLatitude())
                                                .longitude(request.getLongitude())
                                                .waitingPreference(request.isWaitingPreference())
                                                .drinkPreference(request.isDrinkPreference())
                                                .bakeryCount(request.getBakeryCount())
                                                .flexibilityLevel(request.getFlexibilityLevel())
                                                .recommendReason(response.getRecommendReason())
                                                .build();

                                Course course =
                                        Course.createAi(
                                                response.getName(),
                                                user,
                                                userPreference,
                                                aiCourseInfo,
                                                new HashSet<>(request.getBreadTypes()));
                                course.updateAiResult(
                                        response.getEstimatedCost(),
                                        response.getEstimatedTime(),
                                        response.getTheme(),
                                        response.getSummary());

                                Course saved = courseRepository.save(course);

                                response.getBakeries().stream()
                                        .sorted(
                                                Comparator.comparingInt(
                                                        RecommendedBakeryResponse::getOrder))
                                        .forEach(
                                                item -> {
                                                    CourseBakery cb =
                                                            CourseBakery.builder()
                                                                    .bakery(
                                                                            bakeryMap.get(
                                                                                    item.getId()))
                                                                    .course(saved)
                                                                    .visitOrder(item.getOrder())
                                                                    .recommendedBread(
                                                                            item
                                                                                    .getRecommendedBread())
                                                                    .reason(item.getReason())
                                                                    .build();
                                                    saved.addCourseBakery(cb);
                                                });

                                return saved.getId();
                            });

            // 4. Redis 업데이트 (트랜잭션 밖)
            aiCourseRedisService.saveCompleted(jobId, courseId);
            log.info("[AI 코스 생성] 완료: jobId={}, courseId={}", jobId, courseId);

        } catch (CustomException e) {
            log.error("[AI 코스 생성] 실패 jobId={}", jobId, e);
            aiCourseRedisService.saveFailed(jobId, e.getMessage());
        } catch (Exception e) {
            log.error("[AI 코스 생성] 예외 발생 jobId={}", jobId, e);
            aiCourseRedisService.saveFailed(jobId, "AI 서버 오류가 발생했습니다.");
        }
        return CompletableFuture.completedFuture(null);
    }
}
