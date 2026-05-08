package com.breadbread.bakery.repository;

import com.breadbread.bakery.entity.Review;
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
}
