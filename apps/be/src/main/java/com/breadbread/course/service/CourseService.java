package com.breadbread.course.service;

import com.breadbread.bakery.dto.BakerySummaryResponse;
import com.breadbread.bakery.entity.*;
import com.breadbread.bakery.repository.BakeryImageRepository;
import com.breadbread.bakery.repository.BakeryRepository;
import com.breadbread.course.dto.*;
import com.breadbread.course.dto.ai.AiCourseRequest;
import com.breadbread.course.dto.ai.AiJobStatusResponse;
import com.breadbread.course.entity.*;
import com.breadbread.course.repository.CourseBakeryRepository;
import com.breadbread.course.repository.CourseLikeRepository;
import com.breadbread.course.repository.CourseRepository;
import com.breadbread.course.repository.RouteRepository;
import com.breadbread.course.service.ai.AiCourseAsyncService;
import com.breadbread.course.service.ai.AiCourseRedisService;
import com.breadbread.global.exception.CustomException;
import com.breadbread.global.exception.ErrorCode;
import com.breadbread.user.entity.User;
import com.breadbread.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.concurrent.CompletionException;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Slf4j
@Service
@RequiredArgsConstructor
public class CourseService {

    private final CourseRepository courseRepository;
    private final BakeryRepository bakeryRepository;
    private final CourseBakeryRepository courseBakeryRepository;
    private final BakeryImageRepository bakeryImageRepository;
    private final CourseLikeRepository courseLikeRepository;
    private final UserRepository userRepository;
    private final RouteRepository routeRepository;
    private final AiCourseAsyncService aiCourseAsyncService;
    private final AiCourseRedisService aiCourseRedisService;

    @Transactional(readOnly = true)
    public CourseListResponse search(CourseSearch courseSearch, Pageable pageable, Long userId) {
        Page<Course> courses = courseRepository.search(courseSearch, pageable);
        List<Course> content = courses.getContent();
        List<Long> courseIds = content.stream().map(Course::getId).toList();

        List<Long> allBakeryIds = content.stream()
                .flatMap(course -> course.getCourseBakeries().stream())
                .map(cb -> cb.getBakery().getId())
                .distinct()
                .toList();

        Map<Long, String> thumbnailMap = bakeryImageRepository
                .findAllByBakeryIdInAndDisplayOrder(allBakeryIds, 1)
                .stream()
                .collect(Collectors.toMap(img -> img.getBakery().getId(), BakeryImage::getImageUrl));

        Map<Long, Integer> likeCountMap = courseLikeRepository
                .countByCourseIdIn(courseIds)
                .stream()
                .collect(Collectors.toMap(row -> (Long) row[0], row -> ((Long) row[1]).intValue()));

        HashSet<Long> likedCourseIds = userId != null
                ? new HashSet<>(courseLikeRepository.findLikedCourseIdsByUserId(courseIds, userId))
                : new HashSet<>();

        List<CourseSummaryResponse> summaries = content.stream()
                .map(course -> {
                    List<CourseBakerySummary> bakeries = course.getCourseBakeries().stream()
                            .sorted(Comparator.comparingInt(CourseBakery::getVisitOrder))
                            .map(cb -> CourseBakerySummary.from(cb.getBakery(), thumbnailMap.get(cb.getBakery().getId())))
                            .toList();
                    return CourseSummaryResponse.from(
                            course,
                            likeCountMap.getOrDefault(course.getId(), 0),
                            likedCourseIds.contains(course.getId()),
                            bakeries
                    );
                }).toList();

        return CourseListResponse.builder()
                .courses(summaries)
                .total((int) courses.getTotalElements())
                .page(pageable.getPageNumber())
                .size(pageable.getPageSize())
                .hasNext(courses.hasNext())
                .build();
    }

    @Transactional(readOnly = true)
    public CourseDetailResponse findOne(Long id, Long userId, boolean isAdmin) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new CustomException(ErrorCode.COURSE_NOT_FOUND));

        if (!course.isShared() && !isAdmin) {
            if (userId == null) {
                throw new CustomException(ErrorCode.UNAUTHORIZED);
            }
            if (course.getUser() == null || !course.getUser().getId().equals(userId)) {
                throw new CustomException(ErrorCode.FORBIDDEN);
            }
        }

        List<CourseBakery> courseBakeries = courseBakeryRepository.findAllByCourseIdOrderByVisitOrder(id);

        List<Long> bakeryIds = courseBakeries.stream()
                .map(cb -> cb.getBakery().getId())
                .toList();

        Map<Long, String> thumbnailMap = bakeryImageRepository
                .findAllByBakeryIdInAndDisplayOrder(bakeryIds, 1)
                .stream()
                .collect(Collectors.toMap(img -> img.getBakery().getId(), BakeryImage::getImageUrl));

        List<BakerySummaryResponse> bakeries = courseBakeries.stream()
                .map(cb -> BakerySummaryResponse.from(
                        cb.getBakery(),
                        thumbnailMap.get(cb.getBakery().getId()),
                        0L, false))
                .toList();

        int likeCount = (int) courseLikeRepository.countByCourse(course);
        boolean liked = userId != null && courseLikeRepository.existsByCourseIdAndUserId(id, userId);
        return CourseDetailResponse.from(course, likeCount, liked, bakeries);
    }

    @Transactional
    public Long createManual(Long userId, ManualCourseRequest request) {
        if (request.getBakeryIds() == null || request.getBakeryIds().isEmpty()) {
            throw new CustomException(ErrorCode.COURSE_BAKERY_REQUIRED);
        }

        ManualCourseInfo manualCourseInfo = ManualCourseInfo.builder()
                .editorPick(request.isEditorPick())
                .breadType(request.getBreadType())
                .build();

        Course course = Course.createManual(
                request.getName(),
                request.getThumbnailUrl(),
                request.getEstimatedTime(),
                request.getEstimatedCost(),
				request.getTheme(),
				request.getRegion(),
                manualCourseInfo
        );

        Course saved = courseRepository.save(course);

        List<Long> bakeryIds = request.getBakeryIds();
        List<Bakery> bakeries = bakeryRepository.findAllById(bakeryIds);

        if (bakeryIds.size() != new HashSet<>(bakeryIds).size()) {
            throw new CustomException(ErrorCode.INVALID_INPUT_VALUE);
        }

        Map<Long, Bakery> bakeryMap = bakeries.stream()
                .collect(Collectors.toMap(Bakery::getId, b -> b));

        List<Long> notFoundIds = bakeryIds.stream()
                .filter(bid -> !bakeryMap.containsKey(bid))
                .toList();

        if (!notFoundIds.isEmpty()) {
            throw new CustomException(ErrorCode.BAKERY_NOT_FOUND);
        }

        IntStream.range(0, bakeryIds.size())
                .forEach(index -> {
                    CourseBakery courseBakery = CourseBakery.builder()
                            .bakery(bakeryMap.get(bakeryIds.get(index)))
                            .course(saved)
                            .visitOrder(index + 1)
                            .build();
                    saved.addCourseBakery(courseBakery);
                });

        log.info("MANUAL 코스 생성: courseId={}, userId={}", saved.getId(), userId);
        return saved.getId();
    }

    @Transactional
    public void updateManual(Long courseId, UpdateCourseRequest request) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new CustomException(ErrorCode.COURSE_NOT_FOUND));

        ManualCourseInfo manualCourseInfo = null;
        if (request.getEditorPick() != null || request.getRegion() != null
                || request.getTheme() != null || request.getBreadType() != null) {
            ManualCourseInfo current = course.getManualCourseInfo();
            manualCourseInfo = ManualCourseInfo.builder()
                    .editorPick(request.getEditorPick() != null ? request.getEditorPick() : (current != null && current.isEditorPick()))
                    .breadType(request.getBreadType() != null ? request.getBreadType() : (current != null ? current.getBreadType() : null))
                    .build();
        }

        course.updateManual(
                request.getName(),
                request.getThumbnailUrl(),
                request.getEstimatedTime(),
                request.getEstimatedCost(),
				request.getTheme(),
				request.getRegion(),
                manualCourseInfo
        );

        if (request.getBakeryIds() != null) {
            List<Long> bakeryIds = request.getBakeryIds();
            if (bakeryIds.isEmpty()) {
                throw new CustomException(ErrorCode.COURSE_BAKERY_REQUIRED);
            }
            if (bakeryIds.size() != new HashSet<>(bakeryIds).size()) {
                throw new CustomException(ErrorCode.INVALID_INPUT_VALUE);
            }

            List<Bakery> bakeries = bakeryRepository.findAllById(bakeryIds);
            Map<Long, Bakery> bakeryMap = bakeries.stream()
                    .collect(Collectors.toMap(Bakery::getId, b -> b));

            List<Long> notFoundIds = bakeryIds.stream()
                    .filter(bid -> !bakeryMap.containsKey(bid))
                    .toList();

            if (!notFoundIds.isEmpty()) {
                throw new CustomException(ErrorCode.BAKERY_NOT_FOUND);
            }

            course.clearCourseBakeries();

            IntStream.range(0, bakeryIds.size())
                    .forEach(index -> {
                        CourseBakery courseBakery = CourseBakery.builder()
                                .bakery(bakeryMap.get(bakeryIds.get(index)))
                                .visitOrder(index + 1)
                                .build();
                        course.addCourseBakery(courseBakery);
                    });
        }

        log.info("MANUAL 코스 수정: courseId={}", courseId);
    }

    @Transactional
    public void delete(Long courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new CustomException(ErrorCode.COURSE_NOT_FOUND));
        courseRepository.delete(course);
        log.info("코스 삭제: courseId={}", courseId);
    }

    public String createAi(Long userId, AiCourseRequest request) {
        String jobId = UUID.randomUUID().toString();
        aiCourseRedisService.savePending(jobId, userId);
        try {
            aiCourseAsyncService.processAiCourse(jobId, userId, request)
                .whenComplete((unused, throwable) -> {
                    if (throwable == null) {
                        return;
                    }
                    Throwable cause = throwable instanceof CompletionException
                        ? throwable.getCause() : throwable;
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
        return aiCourseRedisService.findByJobId(jobId, requesterId)
            .orElseThrow(() -> new CustomException(ErrorCode.AI_JOB_NOT_FOUND));
    }

    @Transactional
    public void deleteAi(Long courseId, Long userId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new CustomException(ErrorCode.COURSE_NOT_FOUND));

        if (course.getCourseType() != CourseType.AI) {
            throw new CustomException(ErrorCode.NOT_AI_COURSE);
        }
        if (!course.getUser().getId().equals(userId)) {
            throw new CustomException(ErrorCode.FORBIDDEN);
        }

        courseRepository.delete(course);
        log.info("AI 코스 삭제: courseId={}, userId={}", courseId, userId);
    }

    @Transactional
    public void like(Long courseId, Long userId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new CustomException(ErrorCode.COURSE_NOT_FOUND));

        validateCourseActionAccess(course, userId);

        if (courseLikeRepository.existsByCourseIdAndUserId(courseId, userId)) {
            throw new CustomException(ErrorCode.ALREADY_COURSE_LIKED);
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        try {
            courseLikeRepository.save(CourseLike.builder().course(course).user(user).build());
        } catch (DataIntegrityViolationException e) {
            throw new CustomException(ErrorCode.ALREADY_COURSE_LIKED);
        }
    }

    @Transactional
    public void unlike(Long courseId, Long userId) {
        CourseLike like = courseLikeRepository.findByCourseIdAndUserId(courseId, userId).orElseThrow(
                () -> new CustomException(ErrorCode.NOT_COURSE_LIKED)
        );
        courseLikeRepository.delete(like);
    }

    @Transactional(readOnly = true)
    public List<RouteResponse> findMyRoutes(Long userId) {
        List<Route> routes = routeRepository.findByUserId(userId);
        return routes.stream().map(
                route -> RouteResponse.from(route.getCourse())
        ).toList();
    }

    @Transactional
    public void saveRoute(Long courseId, Long userId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new CustomException(ErrorCode.COURSE_NOT_FOUND));

        validateCourseActionAccess(course, userId);

        if (routeRepository.existsByCourseIdAndUserId(courseId, userId)) {
            throw new CustomException(ErrorCode.ALREADY_ROUTED);
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        try {
            routeRepository.save(Route.builder().course(course).user(user).build());
        } catch (DataIntegrityViolationException e) {
            throw new CustomException(ErrorCode.ALREADY_ROUTED);
        }
    }

    @Transactional
    public void removeRoute(Long courseId, Long userId) {
        Route route = routeRepository.findByCourseIdAndUserId(courseId, userId).orElseThrow(
                () -> new CustomException(ErrorCode.NOT_ROUTED)
        );
        routeRepository.delete(route);
    }

    private void validateCourseActionAccess(Course course, Long userId) {
        if (!course.isShared() && (course.getUser() == null || !course.getUser().getId().equals(userId))) {
            throw new CustomException(ErrorCode.FORBIDDEN);
        }
    }
}
