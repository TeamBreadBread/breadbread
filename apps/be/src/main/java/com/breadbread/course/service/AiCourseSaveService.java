package com.breadbread.course.service;

import com.breadbread.bakery.entity.Bakery;
import com.breadbread.bakery.repository.BakeryRepository;
import com.breadbread.course.dto.ai.AiCoursePreviewBakeryResponse;
import com.breadbread.course.dto.ai.AiCoursePreviewResponse;
import com.breadbread.course.dto.ai.AiCourseRequest;
import com.breadbread.course.dto.ai.AiCourseResultCache;
import com.breadbread.course.dto.ai.AiJobStatusResponse;
import com.breadbread.course.dto.ai.RecommendedBakeryResponse;
import com.breadbread.course.entity.AiCourseInfo;
import com.breadbread.course.entity.Course;
import com.breadbread.course.entity.CourseBakery;
import com.breadbread.course.entity.CourseType;
import com.breadbread.course.repository.CourseDrivingRouteRepository;
import com.breadbread.course.repository.CourseRepository;
import com.breadbread.course.service.ai.AiCourseAsyncService;
import com.breadbread.course.service.ai.AiCourseRedisService;
import com.breadbread.course.service.ai.AiCourseResultRedisService;
import com.breadbread.global.exception.CustomException;
import com.breadbread.global.exception.ErrorCode;
import com.breadbread.user.entity.User;
import com.breadbread.user.entity.UserPreference;
import com.breadbread.user.repository.UserPreferenceRepository;
import com.breadbread.user.repository.UserRepository;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletionException;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiCourseSaveService {

    private final CourseRepository courseRepository;
    private final BakeryRepository bakeryRepository;
    private final UserRepository userRepository;
    private final UserPreferenceRepository userPreferenceRepository;
    private final AiCourseAsyncService aiCourseAsyncService;
    private final AiCourseRedisService aiCourseRedisService;
    private final AiCourseResultRedisService aiCourseResultRedisService;
    private final CourseDrivingRouteRepository courseDrivingRouteRepository;

    public String createAi(Long userId, AiCourseRequest request) {
        String jobId = UUID.randomUUID().toString();
        aiCourseRedisService.savePending(jobId, userId);
        try {
            aiCourseAsyncService
                    .processAiCourse(jobId, userId, request)
                    .whenComplete(
                            (unused, throwable) -> {
                                if (throwable == null) {
                                    return;
                                }
                                Throwable cause =
                                        throwable instanceof CompletionException
                                                ? throwable.getCause()
                                                : throwable;
                                log.error("[AI 코스 생성] 비동기 실행 실패 후처리 jobId={}", jobId, cause);
                                aiCourseRedisService.saveFailed(jobId, "작업 처리 중 오류가 발생했습니다.");
                            });
        } catch (Exception e) {
            log.error("[AI 코스 생성] 비동기 작업 제출 실패 jobId={}", jobId, e);
            aiCourseRedisService.saveFailed(jobId, "작업 제출에 실패했습니다.");
            throw new CustomException(ErrorCode.AI_SERVER_ERROR);
        }
        log.info("[AI 코스 생성] 비동기 작업 시작: jobId={}, userId={}", jobId, userId);
        return jobId;
    }

    public AiJobStatusResponse getAiJobStatus(String jobId, Long requesterId) {
        return aiCourseRedisService
                .findByJobId(jobId, requesterId)
                .orElseThrow(() -> new CustomException(ErrorCode.AI_JOB_NOT_FOUND));
    }

    @Transactional(readOnly = true)
    public AiCoursePreviewResponse getAiPreview(String jobId, Long userId) {
        AiCourseResultCache cache =
                aiCourseResultRedisService
                        .getResult(jobId, userId)
                        .orElseThrow(() -> new CustomException(ErrorCode.AI_RESULT_NOT_FOUND));

        var webhookResponse = cache.getResponse();
        List<RecommendedBakeryResponse> aiBakeries = webhookResponse.getBakeries();

        // 추천 빵집 ID 목록
        List<Long> bakeryIds = aiBakeries.stream().map(RecommendedBakeryResponse::getId).toList();

        // DB에서 빵집 정보 일괄 조회 (주소·좌표·평점)
        Map<Long, Bakery> bakeryMap =
                bakeryRepository.findAllByIdInAndActiveTrue(bakeryIds).stream()
                        .collect(Collectors.toMap(Bakery::getId, b -> b));

        // 저장과 동일 기준: DB에 없거나 비활성화된 추천 빵집이 있으면 예외
        if (bakeryMap.size() != bakeryIds.size()) {
            throw new CustomException(ErrorCode.AI_RECOMMENDED_BAKERY_NOT_FOUND);
        }

        // AI 순서 기준 정렬 후 DB 정보 병합
        List<AiCoursePreviewBakeryResponse> enrichedBakeries =
                aiBakeries.stream()
                        .sorted(Comparator.comparingInt(RecommendedBakeryResponse::getOrder))
                        .map(ai -> AiCoursePreviewBakeryResponse.of(ai, bakeryMap.get(ai.getId())))
                        .toList();

        return AiCoursePreviewResponse.of(webhookResponse, enrichedBakeries);
    }

    @Transactional
    public Long saveAiCourse(String jobId, Long userId, List<Long> bakeryOrder) {
        // 동시 저장 요청 차단 — SET NX EX 락
        if (!aiCourseResultRedisService.tryAcquireSaveLock(jobId)) {
            throw new CustomException(ErrorCode.AI_COURSE_SAVE_IN_PROGRESS);
        }
        try {
            // 삭제는 커밋 후 수행 — DB 저장 실패 시 결과가 유실되지 않도록 보호
            AiCourseResultCache cache =
                    aiCourseResultRedisService
                            .getResult(jobId, userId)
                            .orElseThrow(() -> new CustomException(ErrorCode.AI_RESULT_NOT_FOUND));

            var request = cache.getRequest();
            var response = cache.getResponse();

            User user =
                    userRepository
                            .findById(userId)
                            .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
            UserPreference userPreference =
                    userPreferenceRepository
                            .findByUserId(userId)
                            .orElseThrow(() -> new CustomException(ErrorCode.PREFERENCE_NOT_FOUND));

            List<Long> recommendedIds =
                    response.getBakeries().stream().map(RecommendedBakeryResponse::getId).toList();
            Map<Long, Bakery> bakeryMap =
                    bakeryRepository.findAllByIdInAndActiveTrue(recommendedIds).stream()
                            .collect(Collectors.toMap(Bakery::getId, b -> b));

            if (bakeryMap.size() != recommendedIds.size()) {
                throw new CustomException(ErrorCode.AI_RECOMMENDED_BAKERY_NOT_FOUND);
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

            // 사용자 지정 순서가 있으면 유효성 검사 후 적용, 없으면 AI 추천 순서 사용
            List<Long> effectiveOrder;
            if (bakeryOrder != null && !bakeryOrder.isEmpty()) {
                boolean validOrder =
                        bakeryOrder.size() == recommendedIds.size()
                                && new HashSet<>(bakeryOrder).equals(new HashSet<>(recommendedIds));
                if (!validOrder) {
                    throw new CustomException(ErrorCode.BAKERY_ORDER_COUNT_MISMATCH);
                }
                effectiveOrder = bakeryOrder;
            } else {
                effectiveOrder =
                        response.getBakeries().stream()
                                .sorted(
                                        Comparator.comparingInt(
                                                RecommendedBakeryResponse::getOrder))
                                .map(RecommendedBakeryResponse::getId)
                                .toList();
            }

            Map<Long, RecommendedBakeryResponse> aiMetaMap =
                    response.getBakeries().stream()
                            .collect(Collectors.toMap(RecommendedBakeryResponse::getId, r -> r));

            for (int i = 0; i < effectiveOrder.size(); i++) {
                Long bakeryId = effectiveOrder.get(i);
                RecommendedBakeryResponse meta = aiMetaMap.get(bakeryId);
                CourseBakery cb =
                        CourseBakery.builder()
                                .bakery(bakeryMap.get(bakeryId))
                                .course(saved)
                                .visitOrder(i + 1)
                                .recommendedBread(meta.getRecommendedBread())
                                .reason(meta.getReason())
                                .build();
                saved.addCourseBakery(cb);
            }

            // 커밋 성공 후 Redis 결과 + 락 정리
            // 트랜잭션 동기화가 활성 상태(정상 프로덕션)이면 afterCommit에 등록,
            // 비활성(단위 테스트 등)이면 즉시 정리
            if (TransactionSynchronizationManager.isSynchronizationActive()) {
                TransactionSynchronizationManager.registerSynchronization(
                        new TransactionSynchronization() {
                            @Override
                            public void afterCommit() {
                                aiCourseResultRedisService.deleteResult(jobId);
                                aiCourseResultRedisService.releaseSaveLock(jobId);
                                aiCourseRedisService.deleteJob(jobId);
                                log.info(
                                        "[AI 코스 저장] Redis 정리 완료: jobId={}, courseId={}",
                                        jobId,
                                        saved.getId());
                            }
                        });
            } else {
                aiCourseResultRedisService.deleteResult(jobId);
                aiCourseResultRedisService.releaseSaveLock(jobId);
                aiCourseRedisService.deleteJob(jobId);
            }

            log.info(
                    "[AI 코스 저장] 완료: jobId={}, courseId={}, userId={}",
                    jobId,
                    saved.getId(),
                    userId);
            return saved.getId();

        } catch (Exception e) {
            // DB 저장 실패 시 락 즉시 해제 — 재시도 허용
            aiCourseResultRedisService.releaseSaveLock(jobId);
            throw e;
        }
    }

    @Transactional
    public void deleteAi(Long courseId, Long userId) {
        Course course =
                courseRepository
                        .findByIdAndActiveTrue(courseId)
                        .orElseThrow(() -> new CustomException(ErrorCode.COURSE_NOT_FOUND));

        if (course.getCourseType() != CourseType.AI) {
            throw new CustomException(ErrorCode.NOT_AI_COURSE);
        }
        if (course.getUser() == null || !course.getUser().getId().equals(userId)) {
            throw new CustomException(ErrorCode.FORBIDDEN);
        }

        course.deactivate();
        courseDrivingRouteRepository.deleteAllByCourseIdIn(List.of(courseId));
        log.info("AI 코스 삭제: courseId={}, userId={}", courseId, userId);
    }
}
