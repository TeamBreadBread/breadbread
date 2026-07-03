package com.breadbread.course.service;

import com.breadbread.bakery.entity.Bakery;
import com.breadbread.course.dto.request.ReorderBakeriesRequest;
import com.breadbread.course.dto.response.DrivingRouteResponse;
import com.breadbread.course.dto.response.ReorderBakeriesResponse;
import com.breadbread.course.entity.AiCourseInfo;
import com.breadbread.course.entity.Course;
import com.breadbread.course.entity.CourseBakery;
import com.breadbread.course.entity.CourseType;
import com.breadbread.course.entity.RouteMode;
import com.breadbread.course.repository.CourseBakeryRepository;
import com.breadbread.course.repository.CourseRepository;
import com.breadbread.course.service.ai.AiCourseRouteOptimizer;
import com.breadbread.global.exception.CustomException;
import com.breadbread.global.exception.ErrorCode;
import com.breadbread.global.util.GeoDistance;
import com.breadbread.tour.service.TourRedisService;
import com.breadbread.user.entity.UserRole;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class CourseBakeryOrderService {

    private final CourseRepository courseRepository;
    private final CourseBakeryRepository courseBakeryRepository;
    private final CourseDrivingRouteService courseDrivingRouteService;
    private final TourRedisService tourRedisService;
    private final AiCourseRouteOptimizer aiCourseRouteOptimizer;

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

        // 투어 진행 중이면 이미 방문한 빵집 순서는 변경 불가
        tourRedisService
                .getTourState(userId)
                .filter(
                        state ->
                                state.getCourseId().equals(courseId)
                                        && state.getStatus()
                                                == com.breadbread.tour.redis.TourStatus.IN_PROGRESS)
                .ifPresent(
                        state -> {
                            int visitedCount = state.getCurrentVisitOrder();
                            if (visitedCount == 0) return;

                            List<Long> visitedOrder =
                                    courseBakeries.stream()
                                            .filter(cb -> cb.getVisitOrder() <= visitedCount)
                                            .sorted(
                                                    Comparator.comparingInt(
                                                            CourseBakery::getVisitOrder))
                                            .map(cb -> cb.getBakery().getId())
                                            .toList();

                            for (int i = 0; i < visitedOrder.size(); i++) {
                                if (!activeBakeryOrder.get(i).equals(visitedOrder.get(i))) {
                                    throw new CustomException(ErrorCode.TOUR_INVALID_VISIT_ORDER);
                                }
                            }
                        });

        // visitOrder 업데이트
        Map<Long, CourseBakery> bakeryMap =
                courseBakeries.stream()
                        .collect(Collectors.toMap(cb -> cb.getBakery().getId(), cb -> cb));

        for (int i = 0; i < activeBakeryOrder.size(); i++) {
            final int order = i + 1;
            bakeryMap.get(activeBakeryOrder.get(i)).setVisitOrder(order);
        }

        // 순서 변경으로 기존 경로 캐시 무효화
        courseDrivingRouteService.invalidateCache(courseId);
        log.info("코스 빵집 순서 변경으로 경로 캐시 삭제: courseId={}", courseId);

        // 새 순서로 전체 활성 빵집 목록 구성 후 경로 재조회
        List<Bakery> orderedBakeries =
                activeBakeryOrder.stream().map(id -> bakeryMap.get(id).getBakery()).toList();
        int totalStayMinutes =
                orderedBakeries.stream().mapToInt(Bakery::getEstimatedStayMinutes).sum();

        int estimatedTotalMinutes = 0;
        try {
            DrivingRouteResponse routeResponse =
                    courseDrivingRouteService.fetchAndSaveRoute(
                            course,
                            orderedBakeries,
                            orderedBakeries.stream().map(Bakery::getEstimatedStayMinutes).toList(),
                            totalStayMinutes,
                            RouteMode.DRIVING);
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

    @Transactional
    public ReorderBakeriesResponse optimizeBakeryOrder(
            Long courseId, Long userId, UserRole role, RouteMode routeMode) {
        Course course =
                courseRepository
                        .findByIdAndActiveTrue(courseId)
                        .orElseThrow(() -> new CustomException(ErrorCode.COURSE_NOT_FOUND));

        validateEditAccess(course, userId, role);

        if (course.getCourseType() != CourseType.AI || course.getAiCourseInfo() == null) {
            throw new CustomException(ErrorCode.INVALID_INPUT_VALUE);
        }

        List<CourseBakery> courseBakeries =
                courseBakeryRepository.findAllByCourseId(courseId).stream()
                        .filter(cb -> cb.getBakery().isActive())
                        .sorted(Comparator.comparingInt(CourseBakery::getVisitOrder))
                        .toList();

        if (courseBakeries.size() < 2) {
            return buildResponse(courseId, courseBakeries, 0);
        }

        AiCourseInfo aiInfo = course.getAiCourseInfo();

        // 투어 진행 중이면 방문 완료한 빵집은 순서 고정, 나머지만 최적화
        int visitedCount =
                tourRedisService
                        .getTourState(userId)
                        .filter(
                                state ->
                                        state.getCourseId().equals(courseId)
                                                && state.getStatus()
                                                        == com.breadbread.tour.redis.TourStatus
                                                                .IN_PROGRESS)
                        .map(state -> state.getCurrentVisitOrder())
                        .orElse(0);

        List<CourseBakery> visitedBakeries =
                courseBakeries.stream()
                        .filter(cb -> cb.getVisitOrder() <= visitedCount)
                        .sorted(Comparator.comparingInt(CourseBakery::getVisitOrder))
                        .toList();
        List<CourseBakery> remainingBakeries =
                courseBakeries.stream()
                        .filter(cb -> cb.getVisitOrder() > visitedCount)
                        .sorted(Comparator.comparingInt(CourseBakery::getVisitOrder))
                        .toList();

        if (remainingBakeries.size() < 2) {
            return buildResponse(courseId, courseBakeries, 0);
        }

        // 출발점: 마지막으로 방문한 빵집 좌표, 없으면 AI 코스 출발 위치
        double departureLat, departureLng;
        if (!visitedBakeries.isEmpty()) {
            Bakery lastVisited = visitedBakeries.get(visitedBakeries.size() - 1).getBakery();
            departureLat = lastVisited.getLatitude();
            departureLng = lastVisited.getLongitude();
        } else {
            departureLat = aiInfo.getLatitude();
            departureLng = aiInfo.getLongitude();
        }

        Map<Long, double[]> bakeryCoords =
                remainingBakeries.stream()
                        .map(CourseBakery::getBakery)
                        .filter(
                                b ->
                                        GeoDistance.isValidCoordinate(
                                                b.getLatitude(), b.getLongitude()))
                        .collect(
                                Collectors.toMap(
                                        Bakery::getId,
                                        b -> new double[] {b.getLatitude(), b.getLongitude()}));

        List<Long> optimizedRemaining =
                aiCourseRouteOptimizer.optimizeOrder(
                        departureLat, departureLng, remainingBakeries, bakeryCoords, routeMode);

        // 방문 완료 빵집 순서 유지 + 최적화된 나머지 순서 합산
        List<Long> optimizedOrder = new java.util.ArrayList<>();
        visitedBakeries.forEach(cb -> optimizedOrder.add(cb.getBakery().getId()));
        optimizedOrder.addAll(optimizedRemaining);

        Map<Long, CourseBakery> bakeryMap =
                courseBakeries.stream()
                        .collect(Collectors.toMap(cb -> cb.getBakery().getId(), cb -> cb));

        for (int i = 0; i < optimizedOrder.size(); i++) {
            bakeryMap.get(optimizedOrder.get(i)).setVisitOrder(i + 1);
        }

        courseDrivingRouteService.invalidateCache(courseId);
        log.info("코스 경로 최적화로 순서 변경 및 경로 캐시 삭제: courseId={}", courseId);

        List<Bakery> orderedBakeries =
                optimizedOrder.stream().map(id -> bakeryMap.get(id).getBakery()).toList();
        int totalStayMinutes =
                orderedBakeries.stream().mapToInt(Bakery::getEstimatedStayMinutes).sum();

        int estimatedTotalMinutes = 0;
        try {
            DrivingRouteResponse routeResponse =
                    courseDrivingRouteService.fetchAndSaveRoute(
                            course,
                            orderedBakeries,
                            orderedBakeries.stream().map(Bakery::getEstimatedStayMinutes).toList(),
                            totalStayMinutes,
                            RouteMode.DRIVING);
            estimatedTotalMinutes = routeResponse.getTotalMinutes();
            course.updateTotalMinutes(estimatedTotalMinutes);
        } catch (CustomException e) {
            log.warn("코스 최적화 후 경로 갱신 실패: courseId={}, error={}", courseId, e.getErrorCode().name());
        }

        return ReorderBakeriesResponse.builder()
                .courseId(courseId)
                .bakeryOrder(optimizedOrder)
                .estimatedTotalMinutes(estimatedTotalMinutes)
                .build();
    }

    private ReorderBakeriesResponse buildResponse(
            Long courseId, List<CourseBakery> courseBakeries, int estimatedTotalMinutes) {
        return ReorderBakeriesResponse.builder()
                .courseId(courseId)
                .bakeryOrder(courseBakeries.stream().map(cb -> cb.getBakery().getId()).toList())
                .estimatedTotalMinutes(estimatedTotalMinutes)
                .build();
    }

    private void validateEditAccess(Course course, Long userId, UserRole role) {
        if (role == UserRole.ROLE_ADMIN) return;
        if (course.getUser() == null || !course.getUser().getId().equals(userId)) {
            throw new CustomException(ErrorCode.FORBIDDEN);
        }
    }
}
