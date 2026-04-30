package com.breadbread.course.repository;

import com.breadbread.course.entity.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface CourseRepository extends JpaRepository<Course, Long>, CourseRepositoryCustom {
	@Query("SELECT DISTINCT c FROM Course c " +
		"LEFT JOIN FETCH c.courseBakeries cb " +
		"LEFT JOIN FETCH cb.bakery " +
		"LEFT JOIN FETCH c.courseLikes " +
		"WHERE c.shared = true")
	List<Course> findAllSharedWithDetails();
}
