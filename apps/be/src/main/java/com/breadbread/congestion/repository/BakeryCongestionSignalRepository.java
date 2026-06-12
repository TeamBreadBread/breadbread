package com.breadbread.congestion.repository;

import com.breadbread.congestion.entity.BakeryCongestionSignal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BakeryCongestionSignalRepository
        extends JpaRepository<BakeryCongestionSignal, Long> {

    Optional<BakeryCongestionSignal> findTopByBakeryIdOrderByCollectedAtDescIdDesc(Long bakeryId);

    @Query(
            value =
                    "SELECT * FROM bakery_congestion_signal b"
                            + " WHERE b.bakery_id IN :bakeryIds"
                            + " AND b.id = ("
                            + "   SELECT b2.id FROM bakery_congestion_signal b2"
                            + "   WHERE b2.bakery_id = b.bakery_id"
                            + "   ORDER BY b2.collected_at DESC, b2.id DESC LIMIT 1"
                            + " )"
                            + " ORDER BY b.congestion_score ASC",
            nativeQuery = true)
    List<BakeryCongestionSignal> findLatestByBakeryIds(@Param("bakeryIds") List<Long> bakeryIds);

    @Query(
            "SELECT s FROM BakeryCongestionSignal s"
                    + " WHERE s.createdAt >= :from AND s.createdAt <= :to"
                    + " ORDER BY s.createdAt DESC")
    Page<BakeryCongestionSignal> findAllByCreatedAtRange(
            @Param("from") LocalDateTime from, @Param("to") LocalDateTime to, Pageable pageable);
}
