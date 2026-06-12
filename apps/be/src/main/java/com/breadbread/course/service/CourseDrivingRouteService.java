package com.breadbread.course.service;

import com.breadbread.bakery.entity.Bakery;
import com.breadbread.course.client.DrivingRouteClient;
import com.breadbread.course.dto.response.DrivingRouteResponse;
import com.breadbread.course.dto.route.Coordinate;
import com.breadbread.course.dto.route.RouteResult;
import com.breadbread.course.entity.AiCourseInfo;
import com.breadbread.course.entity.Course;
import com.breadbread.course.entity.CourseBakery;
import com.breadbread.course.entity.CourseDrivingRoute;
import com.breadbread.course.entity.CourseType;
import com.breadbread.course.repository.CourseDrivingRouteRepository;
import com.breadbread.course.repository.CourseRepository;
import com.breadbread.global.exception.CustomException;
import com.breadbread.global.exception.ErrorCode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class CourseDrivingRouteService {

    private final CourseRepository courseRepository;
    private final CourseDrivingRouteRepository courseDrivingRouteRepository;
    private final CourseDrivingRouteSaver courseDrivingRouteSaver;
    private final DrivingRouteClient drivingRouteClient;

    @Transactional
    public DrivingRouteResponse getDrivingRoute(Long courseId, Long userId) {
        Course course =
                courseRepository
                        .findActiveWithBakeriesById(courseId)
                        .orElseThrow(() -> new CustomException(ErrorCode.COURSE_NOT_FOUND));

        List<Bakery> orderedBakeries =
                course.getCourseBakeries().stream()
                        .sorted(Comparator.comparingInt(CourseBakery::getVisitOrder))
                        .map(CourseBakery::getBakery)
                        .filter(Bakery::isActive)
                        .toList();
        int totalStayMinutes =
                orderedBakeries.stream().mapToInt(Bakery::getEstimatedStayMinutes).sum();
        List<Integer> stayMinutesPerBakery =
                orderedBakeries.stream().map(Bakery::getEstimatedStayMinutes).toList();

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

    public void invalidateCache(Long courseId) {
        courseDrivingRouteRepository.deleteAllByCourseIdIn(List.of(courseId));
    }

    public DrivingRouteResponse fetchAndSaveDrivingRoute(
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
}
