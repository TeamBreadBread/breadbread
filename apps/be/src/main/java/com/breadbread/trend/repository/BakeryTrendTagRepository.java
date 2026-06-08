package com.breadbread.trend.repository;

import com.breadbread.trend.entity.BakeryTrendTag;
import com.breadbread.trend.entity.TrendStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BakeryTrendTagRepository extends JpaRepository<BakeryTrendTag, Long> {

    // 빵 키워드 조회 — 최신 수집 기준, trendScore 내림차순
    @Query(
            value =
                    "SELECT t FROM BakeryTrendTag t"
                            + " WHERE t.id = ("
                            + "   SELECT t2.id FROM BakeryTrendTag t2"
                            + "   WHERE t2.keyword = t.keyword"
                            + "   ORDER BY t2.collectedAt DESC, t2.id DESC LIMIT 1"
                            + " )"
                            + " ORDER BY t.trendScore DESC",
            countQuery = "SELECT COUNT(DISTINCT t.keyword) FROM BakeryTrendTag t")
    Page<BakeryTrendTag> findLatestByKeyword(Pageable pageable);

    // 빵 키워드 조회 — trendStatus 필터
    @Query(
            value =
                    "SELECT t FROM BakeryTrendTag t"
                            + " WHERE t.trendStatus = :status"
                            + " AND t.id = ("
                            + "   SELECT t2.id FROM BakeryTrendTag t2"
                            + "   WHERE t2.keyword = t.keyword"
                            + "   ORDER BY t2.collectedAt DESC, t2.id DESC LIMIT 1"
                            + " )"
                            + " ORDER BY t.trendScore DESC",
            countQuery =
                    "SELECT COUNT(t) FROM BakeryTrendTag t"
                            + " WHERE t.trendStatus = :status"
                            + " AND t.id = ("
                            + "   SELECT t2.id FROM BakeryTrendTag t2"
                            + "   WHERE t2.keyword = t.keyword"
                            + "   ORDER BY t2.collectedAt DESC, t2.id DESC LIMIT 1"
                            + " )")
    Page<BakeryTrendTag> findLatestByKeywordAndStatus(
            @Param("status") TrendStatus status, Pageable pageable);

    // 빵집 조회 — bakeryId가 있는 것만, 빵집별 최신 1건, trendScore 내림차순
    @Query(
            value =
                    "SELECT * FROM bakery_trend_tag t"
                            + " WHERE t.bakery_id IS NOT NULL"
                            + " AND t.id = ("
                            + "   SELECT t2.id FROM bakery_trend_tag t2"
                            + "   WHERE t2.bakery_id = t.bakery_id"
                            + "   ORDER BY t2.collected_at DESC, t2.id DESC LIMIT 1"
                            + " )"
                            + " ORDER BY t.trend_score DESC",
            countQuery =
                    "SELECT COUNT(DISTINCT t.bakery_id) FROM bakery_trend_tag t"
                            + " WHERE t.bakery_id IS NOT NULL",
            nativeQuery = true)
    Page<BakeryTrendTag> findLatestByBakery(Pageable pageable);

    // 빵집 조회 — 특정 키워드 필터
    @Query(
            value =
                    "SELECT * FROM bakery_trend_tag t"
                            + " WHERE t.bakery_id IS NOT NULL"
                            + " AND t.keyword = :keyword"
                            + " AND t.id = ("
                            + "   SELECT t2.id FROM bakery_trend_tag t2"
                            + "   WHERE t2.bakery_id = t.bakery_id AND t2.keyword = t.keyword"
                            + "   ORDER BY t2.collected_at DESC, t2.id DESC LIMIT 1"
                            + " )"
                            + " ORDER BY t.trend_score DESC",
            countQuery =
                    "SELECT COUNT(DISTINCT t.bakery_id) FROM bakery_trend_tag t"
                            + " WHERE t.bakery_id IS NOT NULL AND t.keyword = :keyword",
            nativeQuery = true)
    Page<BakeryTrendTag> findLatestByBakeryAndKeyword(
            @Param("keyword") String keyword, Pageable pageable);
}
