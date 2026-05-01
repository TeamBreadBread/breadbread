package com.breadbread.course.repository;

import com.breadbread.course.entity.Course;
import com.breadbread.course.entity.Route;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface RouteRepository extends JpaRepository<Route, Long> {
	Optional<Route> findByCourseIdAndUserId(Long courseId, Long userId);
	boolean existsByCourseIdAndUserId(Long courseId, Long userId);
	long countByCourse(Course course);

	// 목록 조회 시 N+1 방지용 배치 쿼리
	@Query("SELECT bl.course.id, COUNT(bl) FROM Route bl WHERE bl.course.id IN :courseIds GROUP BY bl.course.id")
	List<Object[]> countByCourseIdIn(@Param("courseIds") List<Long> courseIds);

	// 유저가 루트로 저장한 courseId 목록 조회
	@Query("SELECT bl.course.id FROM Route bl WHERE bl.course.id IN :courseIds AND bl.user.id = :userId")
	List<Long> findLikedCourseIdsByUserId(@Param("courseIds") List<Long> courseIds, @Param("userId") Long userId);

	List<Route> findByUserId(Long userId);
}
