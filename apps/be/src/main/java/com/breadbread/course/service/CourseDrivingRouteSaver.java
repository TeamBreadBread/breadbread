package com.breadbread.course.service;

import com.breadbread.course.dto.route.RouteResult;
import com.breadbread.course.entity.CourseDrivingRoute;
import com.breadbread.course.entity.RouteMode;
import com.breadbread.course.repository.CourseDrivingRouteRepository;
import com.breadbread.course.repository.CourseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@RequiredArgsConstructor
public class CourseDrivingRouteSaver {

    private final CourseDrivingRouteRepository courseDrivingRouteRepository;
    private final CourseRepository courseRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void save(Long courseId, RouteMode routeMode, RouteResult result) {
        courseDrivingRouteRepository.save(
                CourseDrivingRoute.builder()
                        .courseId(courseId)
                        .routeMode(routeMode)
                        .path(result.getPath())
                        .totalTravelSeconds(result.getTotalDurationSeconds())
                        .legDurations(result.getLegDurationsSeconds())
                        .build());
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void updateCourseTotalMinutes(Long courseId, int totalMinutes) {
        courseRepository
                .findById(courseId)
                .ifPresent(course -> course.updateTotalMinutes(totalMinutes));
    }
}
