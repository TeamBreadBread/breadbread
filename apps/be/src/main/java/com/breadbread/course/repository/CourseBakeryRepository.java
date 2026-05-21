package com.breadbread.course.repository;

import com.breadbread.course.entity.CourseBakery;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CourseBakeryRepository extends JpaRepository<CourseBakery, Long> {
    List<CourseBakery> findAllByCourseIdOrderByVisitOrder(Long id);

    @Query("SELECT cb.course.id FROM CourseBakery cb WHERE cb.bakery.id = :bakeryId")
    List<Long> findCourseIdsByBakeryId(@Param("bakeryId") Long bakeryId);
}
