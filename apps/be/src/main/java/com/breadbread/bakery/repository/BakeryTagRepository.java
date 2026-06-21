package com.breadbread.bakery.repository;

import com.breadbread.bakery.entity.BakeryTag;
import com.breadbread.bakery.entity.enums.BakeryTagType;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BakeryTagRepository extends JpaRepository<BakeryTag, Long> {

    @Query(
            "SELECT bt.tag FROM BakeryTag bt "
                    + "WHERE bt.bakery.id = :bakeryId "
                    + "AND ("
                    + "  (bt.sourceType = 'REVIEW' AND EXISTS (SELECT 1 FROM Review r WHERE r.id = bt.sourceId AND r.active = true)) "
                    + "  OR (bt.sourceType = 'POST' AND EXISTS (SELECT 1 FROM Post p WHERE p.id = bt.sourceId AND p.active = true))"
                    + ") "
                    + "GROUP BY bt.tag HAVING COUNT(bt.tag) >= :minCount")
    List<BakeryTagType> findPopularTagsByBakeryId(
            @Param("bakeryId") Long bakeryId, @Param("minCount") long minCount);

    List<BakeryTag> findAllBySourceTypeAndSourceId(String sourceType, Long sourceId);

    List<BakeryTag> findAllBySourceTypeAndSourceIdIn(String sourceType, List<Long> sourceIds);
}
