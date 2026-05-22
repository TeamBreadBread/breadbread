package com.breadbread.course.repository;

import com.breadbread.course.entity.Course;
import java.util.List;
import java.util.Optional;
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
}
