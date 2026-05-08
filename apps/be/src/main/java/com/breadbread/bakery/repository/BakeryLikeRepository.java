package com.breadbread.bakery.repository;

import com.breadbread.bakery.entity.Bakery;
import com.breadbread.bakery.entity.BakeryLike;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BakeryLikeRepository extends JpaRepository<BakeryLike, Long> {
    Optional<BakeryLike> findByBakeryIdAndUserId(Long bakeryId, Long userId);

    boolean existsByBakeryIdAndUserId(Long bakeryId, Long userId);

    long countByBakery(Bakery bakery);

    // 목록 조회 시 N+1 방지용 배치 쿼리
    @Query(
            "SELECT bl.bakery.id, COUNT(bl) FROM BakeryLike bl WHERE bl.bakery.id IN :bakeryIds GROUP BY bl.bakery.id")
    List<Object[]> countByBakeryIdIn(@Param("bakeryIds") List<Long> bakeryIds);

    // 유저가 좋아요한 bakeryId 목록 조회
    @Query(
            "SELECT bl.bakery.id FROM BakeryLike bl WHERE bl.bakery.id IN :bakeryIds AND bl.user.id = :userId")
    List<Long> findLikedBakeryIdsByUserId(
            @Param("bakeryIds") List<Long> bakeryIds, @Param("userId") Long userId);
}
