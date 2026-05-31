package com.breadbread.course.service;

import com.breadbread.bakery.dto.BakerySummaryResponse;
import com.breadbread.bakery.entity.*;
import com.breadbread.bakery.repository.BakeryImageRepository;
import com.breadbread.bakery.repository.BakeryRepository;
import com.breadbread.bakery.service.BakeryImageUrlResolver;
import com.breadbread.course.client.DrivingRouteClient;
import com.breadbread.course.dto.*;
import com.breadbread.course.dto.ai.AiCourseRequest;
import com.breadbread.course.dto.ai.AiJobStatusResponse;
import com.breadbread.course.entity.*;
import com.breadbread.course.repository.CourseBakeryRepository;
import com.breadbread.course.repository.CourseDrivingRouteRepository;
import com.breadbread.course.repository.CourseLikeRepository;
import com.breadbread.course.repository.CourseRepository;
import com.breadbread.course.repository.RouteRepository;
import com.breadbread.course.service.ai.AiCourseAsyncService;
import com.breadbread.course.service.ai.AiCourseRedisService;
import com.breadbread.global.exception.CustomException;
import com.breadbread.global.exception.ErrorCode;
import com.breadbread.user.entity.User;
import com.breadbread.user.entity.UserRole;
import com.breadbread.user.repository.UserRepository;
import java.util.*;
import java.util.concurrent.CompletionException;
import java.util.stream.Collectors;
import java.util.stream.IntStream;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
    private final DrivingRouteClient drivingRouteClient;
    private final CourseDrivingRouteRepository courseDrivingRouteRepository;
    private final CourseDrivingRouteSaver courseDrivingRouteSaver;
    private final BakeryImageUrlResolver bakeryImageUrlResolver;

    @Transactional(readOnly = true)
    public CourseListResponse search(CourseSearch courseSearch, Pageable pageable, Long userId) {
        Page<Course> courses = courseRepository.search(courseSearch, pageable);
        List<Course> content = courses.getContent();
        List<Long> courseIds = content.stream().map(Course::getId).toList();

        List<Long> allBakeryIds =
                content.stream()
                        .flatMap(course -> course.getCourseBakeries().stream())
                        .map(cb -> cb.getBakery().getId())
                        .distinct()
                        .toList();

        Map<Long, String> thumbnailMap = new HashMap<>();
        bakeryImageRepository
                .findAllByBakeryIdInAndDisplayOrder(allBakeryIds, 1)
                .forEach(
                        img -> {
                            String url = bakeryImageUrlResolver.resolve(img);
                            if (url != null) thumbnailMap.put(img.getBakery().getId(), url);
                        });

        Map<Long, Integer> likeCountMap =
                courseLikeRepository.countByCourseIdIn(courseIds).stream()
                        .collect(
                                Collectors.toMap(
                                        row -> (Long) row[0], row -> ((Long) row[1]).intValue()));

        HashSet<Long> likedCourseIds =
                userId != null
                        ? new HashSet<>(
                                courseLikeRepository.findLikedCourseIdsByUserId(courseIds, userId))
                        : new HashSet<>();

        HashSet<Long> savedCourseIds =
                userId != null
                        ? new HashSet<>(
                                routeRepository.findLikedCourseIdsByUserId(courseIds, userId))
                        : new HashSet<>();

        List<CourseSummaryResponse> summaries =
                content.stream()
                        .map(
                                course -> {
                                    List<CourseBakerySummary> bakeries =
                                            course.getCourseBakeries().stream()
                                                    .sorted(
                                                            Comparator.comparingInt(
                                                                    CourseBakery::getVisitOrder))
                                                    .map(
                                                            cb ->
                                                                    CourseBakerySummary.from(
                                                                            cb.getBakery(),
                                                                            thumbnailMap.get(
                                                                                    cb.getBakery()
                                                                                            .getId())))
                                                    .toList();
                                    return CourseSummaryResponse.from(
                                            course,
                                            likeCountMap.getOrDefault(course.getId(), 0),
                                            likedCourseIds.contains(course.getId()),
                                            savedCourseIds.contains(course.getId()),
                                            bakeries);
                                })
                        .toList();

        return CourseListResponse.builder()
                .courses(summaries)
                .total((int) courses.getTotalElements())
                .page(pageable.getPageNumber())
                .size(pageable.getPageSize())
                .hasNext(courses.hasNext())
                .build();
    }

    @Transactional(readOnly = true)
    public CourseDetailResponse findOne(Long id, Long userId, UserRole role) {
        Course course =
                courseRepository
                        .findByIdAndActiveTrue(id)
                        .orElseThrow(() -> new CustomException(ErrorCode.COURSE_NOT_FOUND));

        if (!course.isShared() && role != UserRole.ROLE_ADMIN) {
            if (userId == null) {
                throw new CustomException(ErrorCode.UNAUTHORIZED);
            }
            if (course.getUser() == null || !course.getUser().getId().equals(userId)) {
                throw new CustomException(ErrorCode.FORBIDDEN);
            }
        }

        List<CourseBakery> courseBakeries =
                courseBakeryRepository.findAllByCourseIdOrderByVisitOrder(id);

        List<Long> bakeryIds = courseBakeries.stream().map(cb -> cb.getBakery().getId()).toList();

        Map<Long, String> thumbnailMap = new HashMap<>();
        bakeryImageRepository
                .findAllByBakeryIdInAndDisplayOrder(bakeryIds, 1)
                .forEach(
                        img -> {
                            String url = bakeryImageUrlResolver.resolve(img);
                            if (url != null) thumbnailMap.put(img.getBakery().getId(), url);
                        });

        List<BakerySummaryResponse> bakeries =
                courseBakeries.stream()
                        .map(
                                cb ->
                                        BakerySummaryResponse.from(
                                                cb.getBakery(),
                                                thumbnailMap.get(cb.getBakery().getId()),
                                                0L,
                                                0L,
                                                false))
                        .toList();

        int likeCount = (int) courseLikeRepository.countByCourse(course);
        boolean liked =
                userId != null && courseLikeRepository.existsByCourseIdAndUserId(id, userId);
        boolean isSaved = userId != null && routeRepository.existsByCourseIdAndUserId(id, userId);
        return CourseDetailResponse.from(course, likeCount, liked, isSaved, bakeries);
    }

    @Transactional
    public Long createManual(Long userId, ManualCourseRequest request) {
        if (request.getBakeryIds() == null || request.getBakeryIds().isEmpty()) {
            throw new CustomException(ErrorCode.COURSE_BAKERY_REQUIRED);
        }

        ManualCourseInfo manualCourseInfo =
                ManualCourseInfo.builder()
                        .editorPick(request.isEditorPick())
                        .breadType(request.getBreadType())
                        .build();

        Course course =
                Course.createManual(
                        request.getName(),
                        request.getThumbnailUrl(),
                        request.getEstimatedTime(),
                        request.getEstimatedCost(),
                        request.getTheme(),
                        request.getRegion(),
                        manualCourseInfo);

        Course saved = courseRepository.save(course);

        List<Long> bakeryIds = request.getBakeryIds();
        List<Bakery> bakeries = bakeryRepository.findAllByIdInAndActiveTrue(bakeryIds);

        if (bakeryIds.size() != new HashSet<>(bakeryIds).size()) {
            throw new CustomException(ErrorCode.INVALID_INPUT_VALUE);
        }

        Map<Long, Bakery> bakeryMap =
                bakeries.stream().collect(Collectors.toMap(Bakery::getId, b -> b));

        List<Long> notFoundIds =
                bakeryIds.stream().filter(bid -> !bakeryMap.containsKey(bid)).toList();

        if (!notFoundIds.isEmpty()) {
            throw new CustomException(ErrorCode.BAKERY_NOT_FOUND);
        }

        IntStream.range(0, bakeryIds.size())
                .forEach(
                        index -> {
                            CourseBakery courseBakery =
                                    CourseBakery.builder()
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
        Course course =
                courseRepository
                        .findByIdAndActiveTrue(courseId)
                        .orElseThrow(() -> new CustomException(ErrorCode.COURSE_NOT_FOUND));

        ManualCourseInfo manualCourseInfo = null;
        if (request.getEditorPick() != null
                || request.getRegion() != null
                || request.getTheme() != null
                || request.getBreadType() != null) {
            ManualCourseInfo current = course.getManualCourseInfo();
            manualCourseInfo =
                    ManualCourseInfo.builder()
                            .editorPick(
                                    request.getEditorPick() != null
                                            ? request.getEditorPick()
                                            : (current != null && current.isEditorPick()))
                            .breadType(
                                    request.getBreadType() != null
                                            ? request.getBreadType()
                                            : (current != null ? current.getBreadType() : null))
                            .build();
        }

        course.updateManual(
                request.getName(),
                request.getThumbnailUrl(),
                request.getEstimatedTime(),
                request.getEstimatedCost(),
                request.getTheme(),
                request.getRegion(),
                manualCourseInfo);

        if (request.getBakeryIds() != null) {
            List<Long> bakeryIds = request.getBakeryIds();
            if (bakeryIds.isEmpty()) {
                throw new CustomException(ErrorCode.COURSE_BAKERY_REQUIRED);
            }
            if (bakeryIds.size() != new HashSet<>(bakeryIds).size()) {
                throw new CustomException(ErrorCode.INVALID_INPUT_VALUE);
            }

            List<Bakery> bakeries = bakeryRepository.findAllByIdInAndActiveTrue(bakeryIds);
            Map<Long, Bakery> bakeryMap =
                    bakeries.stream().collect(Collectors.toMap(Bakery::getId, b -> b));

            List<Long> notFoundIds =
                    bakeryIds.stream().filter(bid -> !bakeryMap.containsKey(bid)).toList();

            if (!notFoundIds.isEmpty()) {
                throw new CustomException(ErrorCode.BAKERY_NOT_FOUND);
            }

            course.clearCourseBakeries();

            IntStream.range(0, bakeryIds.size())
                    .forEach(
                            index -> {
                                CourseBakery courseBakery =
                                        CourseBakery.builder()
                                                .bakery(bakeryMap.get(bakeryIds.get(index)))
                                                .visitOrder(index + 1)
                                                .build();
                                course.addCourseBakery(courseBakery);
                            });

            courseDrivingRouteRepository.deleteAllByCourseIdIn(List.of(courseId));
            log.info("코스 빵집 변경으로 경로 캐시 삭제: courseId={}", courseId);
        }

        log.info("MANUAL 코스 수정: courseId={}", courseId);
    }

    @Transactional
    public void delete(Long courseId) {
        Course course =
                courseRepository
                        .findByIdAndActiveTrue(courseId)
                        .orElseThrow(() -> new CustomException(ErrorCode.COURSE_NOT_FOUND));
        course.deactivate();
        courseDrivingRouteRepository.deleteAllByCourseIdIn(List.of(courseId));
        log.info("코스 삭제: courseId={}", courseId);
    }

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

    @Transactional
    public void like(Long courseId, Long userId) {
        Course course =
                courseRepository
                        .findByIdAndActiveTrue(courseId)
                        .orElseThrow(() -> new CustomException(ErrorCode.COURSE_NOT_FOUND));

        validateCourseActionAccess(course, userId);

        if (courseLikeRepository.existsByCourseIdAndUserId(courseId, userId)) {
            throw new CustomException(ErrorCode.ALREADY_COURSE_LIKED);
        }

        User user =
                userRepository
                        .findById(userId)
                        .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        try {
            courseLikeRepository.save(CourseLike.builder().course(course).user(user).build());
        } catch (DataIntegrityViolationException e) {
            throw new CustomException(ErrorCode.ALREADY_COURSE_LIKED);
        }
    }

    @Transactional
    public void unlike(Long courseId, Long userId) {
        CourseLike like =
                courseLikeRepository
                        .findByCourseIdAndUserId(courseId, userId)
                        .orElseThrow(() -> new CustomException(ErrorCode.NOT_COURSE_LIKED));
        courseLikeRepository.delete(like);
    }

    @Transactional(readOnly = true)
    public List<RouteResponse> findMyRoutes(Long userId) {
        List<Route> routes = routeRepository.findActiveByUserId(userId);
        return routes.stream().map(route -> RouteResponse.from(route.getCourse())).toList();
    }

    @Transactional
    public void saveRoute(Long courseId, Long userId) {
        Course course =
                courseRepository
                        .findByIdAndActiveTrue(courseId)
                        .orElseThrow(() -> new CustomException(ErrorCode.COURSE_NOT_FOUND));

        validateCourseActionAccess(course, userId);

        if (routeRepository.existsByCourseIdAndUserId(courseId, userId)) {
            throw new CustomException(ErrorCode.ALREADY_ROUTED);
        }

        User user =
                userRepository
                        .findById(userId)
                        .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        try {
            routeRepository.save(Route.builder().course(course).user(user).build());
        } catch (DataIntegrityViolationException e) {
            throw new CustomException(ErrorCode.ALREADY_ROUTED);
        }
    }

    @Transactional
    public void removeRoute(Long courseId, Long userId) {
        Route route =
                routeRepository
                        .findByCourseIdAndUserId(courseId, userId)
                        .orElseThrow(() -> new CustomException(ErrorCode.NOT_ROUTED));
        routeRepository.delete(route);
    }

    @Transactional(readOnly = true)
    public DrivingRouteResponse getDrivingRoute(Long courseId, Long userId, UserRole role) {
        Course course =
                courseRepository
                        .findActiveWithBakeriesById(courseId)
                        .orElseThrow(() -> new CustomException(ErrorCode.COURSE_NOT_FOUND));
        validateDrivingRouteAccess(course, userId, role);

        List<Bakery> orderedBakeries =
                course.getCourseBakeries().stream()
                        .sorted(Comparator.comparingInt(CourseBakery::getVisitOrder))
                        .map(CourseBakery::getBakery)
                        .filter(Bakery::isActive)
                        .toList();
        int totalStayMinutes = calculateTotalStayMinutes(orderedBakeries);
        List<Integer> stayMinutesPerBakery = getStayMinutesPerBakery(orderedBakeries);

        DrivingRouteResponse response =
                courseDrivingRouteRepository
                        .findById(courseId)
                        .map(
                                cached ->
                                        buildResponseFromCache(
                                                cached, stayMinutesPerBakery, totalStayMinutes))
                        .orElseGet(
                                () ->
                                        fetchAndSaveDrivingRoute(
                                                course,
                                                orderedBakeries,
                                                stayMinutesPerBakery,
                                                totalStayMinutes));

        courseDrivingRouteSaver.updateCourseTotalMinutes(courseId, response.getTotalMinutes());
        return response;
    }

    private int calculateTotalStayMinutes(List<Bakery> bakeries) {
        return bakeries.stream().mapToInt(Bakery::getEstimatedStayMinutes).sum();
    }

    private List<Integer> getStayMinutesPerBakery(List<Bakery> bakeries) {
        return bakeries.stream().map(Bakery::getEstimatedStayMinutes).toList();
    }

    private DrivingRouteResponse buildResponseFromCache(
            CourseDrivingRoute cached, List<Integer> stayMinutesPerBakery, int totalStayMinutes) {
        List<Integer> legs =
                cached.getLegDurations() == null
                        ? List.of()
                        : cached.getLegDurations().stream()
                                .map(this::secondsToMinutesCeil)
                                .toList();

        int totalTravelMinutes = toTotalTravelMinutes(legs, cached.getTotalTravelSeconds());

        return DrivingRouteResponse.builder()
                .path(cached.getPath())
                .legs(legs)
                .stayMinutesPerBakery(stayMinutesPerBakery)
                .totalTravelMinutes(totalTravelMinutes)
                .totalStayMinutes(totalStayMinutes)
                .totalMinutes(totalTravelMinutes + totalStayMinutes)
                .build();
    }

    private void validateDrivingRouteAccess(Course course, Long userId, UserRole role) {
        if (!course.isShared() && role != UserRole.ROLE_ADMIN) {
            if (userId == null) {
                throw new CustomException(ErrorCode.UNAUTHORIZED);
            }
            if (course.getUser() == null || !course.getUser().getId().equals(userId)) {
                throw new CustomException(ErrorCode.FORBIDDEN);
            }
        }
    }

    private DrivingRouteResponse fetchAndSaveDrivingRoute(
            Course course,
            List<Bakery> orderedBakeries,
            List<Integer> stayMinutesPerBakery,
            int totalStayMinutes) {
        Long courseId = course.getId();

        List<Coordinate> bakeryCoordinates =
                orderedBakeries.stream()
                        .map(bakery -> new Coordinate(bakery.getLatitude(), bakery.getLongitude()))
                        .toList();

        List<Coordinate> coordinates;
        if (course.getCourseType() == CourseType.AI) {
            AiCourseInfo aiInfo = course.getAiCourseInfo();
            if (aiInfo == null) {
                log.error("AI 코스 출발 위치 없음: courseId={}", courseId);
                throw new CustomException(ErrorCode.ROUTE_NOT_FOUND);
            }
            Coordinate startCoord = new Coordinate(aiInfo.getLatitude(), aiInfo.getLongitude());
            coordinates = new ArrayList<>();
            coordinates.add(startCoord);
            coordinates.addAll(bakeryCoordinates);
        } else {
            coordinates = bakeryCoordinates;
        }

        if (coordinates.size() < 2) {
            log.warn("경로 조회 실패 - 경유지 부족: courseId={}, count={}", courseId, coordinates.size());
            throw new CustomException(ErrorCode.ROUTE_INSUFFICIENT_WAYPOINTS);
        }

        // Kakao Directions API: waypoints 최대 5개 (origin + destination 제외)
        if (coordinates.size() > 7) {
            log.warn("경로 조회 실패 - 경유지 초과: courseId={}, count={}", courseId, coordinates.size());
            throw new CustomException(ErrorCode.ROUTE_TOO_MANY_WAYPOINTS);
        }

        RouteResult result = drivingRouteClient.getPath(coordinates);
        try {
            courseDrivingRouteSaver.save(courseId, result);
        } catch (DataIntegrityViolationException e) {
            log.info("동시 경로 저장 충돌 무시 (이미 저장됨): courseId={}", courseId);
        }

        List<Integer> legs =
                result.getLegDurationsSeconds().stream().map(this::secondsToMinutesCeil).toList();
        int totalTravelMinutes = toTotalTravelMinutes(legs, result.getTotalDurationSeconds());

        return DrivingRouteResponse.builder()
                .path(result.getPath())
                .legs(legs)
                .stayMinutesPerBakery(stayMinutesPerBakery)
                .totalTravelMinutes(totalTravelMinutes)
                .totalStayMinutes(totalStayMinutes)
                .totalMinutes(totalTravelMinutes + totalStayMinutes)
                .build();
    }

    private int secondsToMinutesCeil(int seconds) {
        return (int) Math.ceil(seconds / 60.0);
    }

    /** legs가 있으면 합산, 없으면 총 초를 분으로 변환. legs 표시값과 항상 일치함. */
    private int toTotalTravelMinutes(List<Integer> legs, Integer totalSeconds) {
        if (!legs.isEmpty()) {
            return legs.stream().mapToInt(Integer::intValue).sum();
        }
        return secondsToMinutesCeil(totalSeconds != null ? totalSeconds : 0);
    }

    @Transactional
    public ReorderBakeriesResponse reorderBakeries(
            Long courseId, Long userId, UserRole role, ReorderBakeriesRequest request) {
        Course course =
                courseRepository
                        .findByIdAndActiveTrue(courseId)
                        .orElseThrow(() -> new CustomException(ErrorCode.COURSE_NOT_FOUND));

        validateEditAccess(course, userId, role);

        if (request.getBakeryOrder() == null || request.getBakeryOrder().isEmpty()) {
            throw new CustomException(ErrorCode.INVALID_INPUT_VALUE);
        }

        // 현재 코스의 빵집들 (활성만)
        List<CourseBakery> courseBakeries =
                courseBakeryRepository.findAllByCourseId(courseId).stream()
                        .filter(cb -> cb.getBakery().isActive())
                        .toList();

        Set<Long> currentBakeryIds =
                courseBakeries.stream()
                        .map(cb -> cb.getBakery().getId())
                        .collect(Collectors.toSet());

        // 비활성/미포함 ID 제거 후 순서 목록 구성
        List<Long> activeBakeryOrder =
                request.getBakeryOrder().stream().filter(currentBakeryIds::contains).toList();

        // 활성 빵집 목록 내 중복 ID 검증
        if (activeBakeryOrder.size() != new HashSet<>(activeBakeryOrder).size()) {
            throw new CustomException(ErrorCode.INVALID_INPUT_VALUE);
        }

        // 필터링 후 코스의 전체 활성 빵집 목록과 일치하지 않으면 에러
        if (!new HashSet<>(activeBakeryOrder).equals(currentBakeryIds)) {
            throw new CustomException(ErrorCode.BAKERY_ORDER_COUNT_MISMATCH);
        }

        // visitOrder 업데이트
        Map<Long, CourseBakery> bakeryMap =
                courseBakeries.stream()
                        .collect(Collectors.toMap(cb -> cb.getBakery().getId(), cb -> cb));

        for (int i = 0; i < activeBakeryOrder.size(); i++) {
            final int order = i + 1;
            bakeryMap.get(activeBakeryOrder.get(i)).setVisitOrder(order);
        }

        // 순서 변경으로 기존 경로 캐시 무효화
        courseDrivingRouteRepository.deleteAllByCourseIdIn(List.of(courseId));
        log.info("코스 빵집 순서 변경으로 경로 캐시 삭제: courseId={}", courseId);

        // 새 순서로 전체 활성 빵집 목록 구성 후 경로 재조회
        List<Bakery> orderedBakeries =
                activeBakeryOrder.stream().map(id -> bakeryMap.get(id).getBakery()).toList();
        int totalStayMinutes = calculateTotalStayMinutes(orderedBakeries);

        int estimatedTotalMinutes = 0;
        try {
            DrivingRouteResponse routeResponse =
                    fetchAndSaveDrivingRoute(
                            course,
                            orderedBakeries,
                            getStayMinutesPerBakery(orderedBakeries),
                            totalStayMinutes);
            estimatedTotalMinutes = routeResponse.getTotalMinutes();
            course.updateTotalMinutes(estimatedTotalMinutes);
        } catch (CustomException e) {
            log.warn(
                    "코스 순서 변경 후 경로 갱신 실패: courseId={}, error={}",
                    courseId,
                    e.getErrorCode().name());
        }

        log.info(
                "코스 빵집 순서 변경: courseId={}, userId={}, count={}",
                courseId,
                userId,
                activeBakeryOrder.size());

        return ReorderBakeriesResponse.builder()
                .courseId(courseId)
                .bakeryOrder(activeBakeryOrder)
                .estimatedTotalMinutes(estimatedTotalMinutes)
                .build();
    }

    private void validateEditAccess(Course course, Long userId, UserRole role) {
        if (role == UserRole.ROLE_ADMIN) return;
        if (course.getUser() == null || !course.getUser().getId().equals(userId)) {
            throw new CustomException(ErrorCode.FORBIDDEN);
        }
    }

    private void validateCourseActionAccess(Course course, Long userId) {
        if (!course.isShared()
                && (course.getUser() == null || !course.getUser().getId().equals(userId))) {
            throw new CustomException(ErrorCode.FORBIDDEN);
        }
    }
}
