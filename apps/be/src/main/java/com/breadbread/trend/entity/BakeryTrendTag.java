package com.breadbread.trend.entity;

import com.breadbread.global.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "bakery_trend_tag")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class BakeryTrendTag extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String keyword;

    private Double trendScore;

    @Enumerated(EnumType.STRING)
    private TrendStatus trendStatus;

    private Double growthRate;

    private Long bakeryId;

    private String bakeryName;

    // JSON 배열을 문자열로 저장 (예: ["버터떡","소금빵"])
    @Column(columnDefinition = "text")
    private String matchedMenus;

    // JSON 배열을 문자열로 저장 (예: ["NAVER_SEARCH","NAVER_DATALAB"])
    @Column(columnDefinition = "text")
    private String sources;

    private LocalDateTime collectedAt;

    @Builder
    private BakeryTrendTag(
            String keyword,
            Double trendScore,
            TrendStatus trendStatus,
            Double growthRate,
            Long bakeryId,
            String bakeryName,
            String matchedMenus,
            String sources,
            LocalDateTime collectedAt) {
        this.keyword = keyword;
        this.trendScore = trendScore;
        this.trendStatus = trendStatus;
        this.growthRate = growthRate;
        this.bakeryId = bakeryId;
        this.bakeryName = bakeryName;
        this.matchedMenus = matchedMenus;
        this.sources = sources;
        this.collectedAt = collectedAt;
    }
}
