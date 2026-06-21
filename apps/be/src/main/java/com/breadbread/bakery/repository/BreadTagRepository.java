package com.breadbread.bakery.repository;

import com.breadbread.bakery.entity.BreadTag;
import com.breadbread.bakery.entity.enums.BreadTagType;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BreadTagRepository extends JpaRepository<BreadTag, Long> {

    @Query(
            "SELECT bt.tag FROM BreadTag bt "
                    + "WHERE bt.bread.id = :breadId AND bt.review.active = true "
                    + "GROUP BY bt.tag HAVING COUNT(bt.tag) >= :minCount")
    List<BreadTagType> findPopularTagsByBreadId(
            @Param("breadId") Long breadId, @Param("minCount") long minCount);

    List<BreadTag> findAllByReviewId(Long reviewId);

    List<BreadTag> findAllByReviewIdIn(List<Long> reviewIds);
}
