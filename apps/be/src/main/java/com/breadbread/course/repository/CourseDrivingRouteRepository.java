package com.breadbread.course.repository;

import com.breadbread.course.entity.CourseDrivingRoute;
import com.breadbread.course.entity.CourseDrivingRouteId;
import com.breadbread.course.entity.RouteMode;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CourseDrivingRouteRepository
        extends JpaRepository<CourseDrivingRoute, CourseDrivingRouteId> {

    Optional<CourseDrivingRoute> findByIdCourseIdAndIdRouteMode(Long courseId, RouteMode routeMode);

    void deleteByIdCourseIdIn(List<Long> courseIds);
}
