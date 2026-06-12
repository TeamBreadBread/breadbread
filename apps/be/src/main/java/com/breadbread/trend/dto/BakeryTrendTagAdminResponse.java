package com.breadbread.trend.dto;

import com.breadbread.trend.entity.BakeryTrendTag;
import com.breadbread.trend.entity.TrendStatus;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDateTime;
import java.util.List;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class BakeryTrendTagAdminResponse {
    private Long id;
    private String keyword;
    private Double trendScore;
    private TrendStatus trendStatus;
    private Double growthRate;
    private Long bakeryId;
    private String bakeryName;
    private List<String> matchedMenus;
    private List<String> sources;
    private LocalDateTime collectedAt;
    private LocalDateTime createdAt;

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private static List<String> parseJsonArray(String json) {
        if (json == null || json.isBlank()) return List.of();
        try {
            return MAPPER.readValue(json, new TypeReference<>() {});
        } catch (Exception e) {
            return List.of();
        }
    }

    public static BakeryTrendTagAdminResponse from(BakeryTrendTag tag) {
        return BakeryTrendTagAdminResponse.builder()
                .id(tag.getId())
                .keyword(tag.getKeyword())
                .trendScore(tag.getTrendScore())
                .trendStatus(tag.getTrendStatus())
                .growthRate(tag.getGrowthRate())
                .bakeryId(tag.getBakeryId())
                .bakeryName(tag.getBakeryName())
                .matchedMenus(parseJsonArray(tag.getMatchedMenus()))
                .sources(parseJsonArray(tag.getSources()))
                .collectedAt(tag.getCollectedAt())
                .createdAt(tag.getCreatedAt())
                .build();
    }
}
