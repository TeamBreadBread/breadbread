package com.breadbread.course.repository;

import com.breadbread.course.entity.CourseBakery;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CourseBakeryRepository extends JpaRepository<CourseBakery, Long> {
    List<CourseBakery> findAllByCourseIdOrderByVisitOrder(Long id);

    List<CourseBakery> findAllByCourseId(Long courseId);

    @Query("SELECT cb.course.id FROM CourseBakery cb WHERE cb.bakery.id = :bakeryId")
    List<Long> findCourseIdsByBakeryId(@Param("bakeryId") Long bakeryId);

    /** 혼잡도 체크용 — bakery N+1 방지 */
    @Query(
            "SELECT cb FROM CourseBakery cb JOIN FETCH cb.bakery WHERE cb.course.id = :courseId"
                    + " ORDER BY cb.visitOrder")
    List<CourseBakery> findAllByCourseIdWithBakery(@Param("courseId") Long courseId);
}
