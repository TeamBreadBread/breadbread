package com.breadbread.course.repository;

import com.breadbread.course.entity.CourseBakery;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CourseBakeryRepository extends JpaRepository<CourseBakery, Long> {
	List<CourseBakery> findAllByCourseIdOrderByVisitOrder(Long id);
}
