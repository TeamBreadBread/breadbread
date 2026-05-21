package com.breadbread.course.service;

import com.breadbread.course.dto.Coordinate;
import com.breadbread.course.entity.CourseDrivingRoute;
import com.breadbread.course.repository.CourseDrivingRouteRepository;
import java.util.List;
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

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void save(Long courseId, List<Coordinate> path) {
        courseDrivingRouteRepository.save(
                CourseDrivingRoute.builder().courseId(courseId).path(path).build());
    }
}
