package com.breadbread.course.repository;

import com.breadbread.course.entity.CourseDrivingRoute;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CourseDrivingRouteRepository extends JpaRepository<CourseDrivingRoute, Long> {

    void deleteAllByCourseIdIn(List<Long> courseIds);
}
