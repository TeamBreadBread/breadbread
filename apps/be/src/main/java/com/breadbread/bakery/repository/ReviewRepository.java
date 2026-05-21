package com.breadbread.bakery.repository;

import com.breadbread.bakery.entity.Review;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    Page<Review> findAllByBakeryId(Long bakeryId, Pageable pageable);

    Optional<Review> findByIdAndBakeryId(Long id, Long bakeryId);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.bakery.id = :bakeryId")
    Optional<Double> findAverageRatingByBakeryId(@Param("bakeryId") Long bakeryId);

    List<Review> findAllByUserIdOrderByCreatedAtDesc(Long userId);

    @Query(
            value = "SELECT r.id FROM Review r WHERE r.user.id = :userId ORDER BY r.createdAt DESC",
            countQuery = "SELECT COUNT(r) FROM Review r WHERE r.user.id = :userId")
    Page<Long> findPageIdsByUserIdOrderByCreatedAtDesc(
            @Param("userId") Long userId, Pageable pageable);

    @Query(
            "SELECT DISTINCT r FROM Review r "
                    + "JOIN FETCH r.bakery "
                    + "LEFT JOIN FETCH r.imageUrls "
                    + "WHERE r.id IN :reviewIds")
    List<Review> findAllWithBakeryAndImagesByIdIn(@Param("reviewIds") List<Long> reviewIds);
}
