package com.breadbread.course.repository;

import com.breadbread.course.entity.Course;
import com.breadbread.course.entity.CourseType;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CourseRepository extends JpaRepository<Course, Long>, CourseRepositoryCustom {
    Optional<Course> findByIdAndActiveTrue(Long id);

    @Query(
            "SELECT DISTINCT c FROM Course c "
                    + "LEFT JOIN FETCH c.courseBakeries cb "
                    + "LEFT JOIN FETCH cb.bakery "
                    + "LEFT JOIN FETCH c.courseLikes "
                    + "WHERE c.shared = true AND c.active = true")
    List<Course> findAllSharedWithDetails();

    @Query(
            "SELECT DISTINCT c FROM Course c "
                    + "LEFT JOIN FETCH c.courseBakeries cb "
                    + "LEFT JOIN FETCH cb.bakery "
                    + "WHERE c.id IN :courseIds AND c.active = true")
    List<Course> findAllActiveWithBakeriesByIdIn(@Param("courseIds") List<Long> courseIds);

    @Query(
            "SELECT DISTINCT c FROM Course c "
                    + "LEFT JOIN FETCH c.courseBakeries cb "
                    + "LEFT JOIN FETCH cb.bakery "
                    + "WHERE c.id = :id AND c.active = true")
    Optional<Course> findActiveWithBakeriesById(@Param("id") Long id);

    @Query(
            value =
                    "SELECT DISTINCT c FROM Course c "
                            + "LEFT JOIN FETCH c.courseBakeries cb "
                            + "LEFT JOIN FETCH cb.bakery "
                            + "LEFT JOIN FETCH c.user "
                            + "WHERE c.courseType = :type AND c.active = true",
            countQuery =
                    "SELECT COUNT(c) FROM Course c "
                            + "WHERE c.courseType = :type AND c.active = true")
    Page<Course> findAllByActiveTrueAndCourseType(
            @Param("type") CourseType type, Pageable pageable);

    // 1단계: ID + 페이징만 (컬렉션 fetch join 없음 → DB 레벨 페이징 보장)
    @Query(
            "SELECT c.id FROM Course c "
                    + "WHERE c.courseType = :type AND c.active = true "
                    + "AND c.createdAt >= :from AND c.createdAt <= :to "
                    + "ORDER BY c.createdAt DESC")
    Page<Long> findIdsByActiveTrueAndCourseTypeAndCreatedAtRange(
            @Param("type") CourseType type,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            Pageable pageable);

    // 2단계: ID 목록으로 상세 fetch (컬렉션 fetch join, 페이징 없음)
    @Query(
            "SELECT DISTINCT c FROM Course c "
                    + "LEFT JOIN FETCH c.courseBakeries cb "
                    + "LEFT JOIN FETCH cb.bakery "
                    + "LEFT JOIN FETCH c.user "
                    + "WHERE c.id IN :ids")
    List<Course> findAllWithDetailsByIdIn(@Param("ids") List<Long> ids);
}
