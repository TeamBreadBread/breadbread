package com.breadbread.course.repository;

import com.breadbread.course.entity.CourseBakery;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CourseBakeryRepository extends JpaRepository<CourseBakery, Long> {
    List<CourseBakery> findAllByCourseIdOrderByVisitOrder(Long id);
}
