package com.breadbread.trend.dto;

import com.breadbread.trend.entity.BakeryTrendTag;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class TrendBakeryResponse {

    private Long bakeryId;
    private String bakeryName;
    private String keyword;
    private Double trendScore;
    private String trendStatus;
    private Double growthRate;
    private List<String> matchedMenus;
    private List<String> sources;
    private LocalDateTime collectedAt;

    public static TrendBakeryResponse from(BakeryTrendTag tag) {
        return TrendBakeryResponse.builder()
                .bakeryId(tag.getBakeryId())
                .bakeryName(tag.getBakeryName())
                .keyword(tag.getKeyword())
                .trendScore(tag.getTrendScore())
                .trendStatus(tag.getTrendStatus() != null ? tag.getTrendStatus().name() : null)
                .growthRate(tag.getGrowthRate())
                .matchedMenus(parseList(tag.getMatchedMenus()))
                .sources(parseList(tag.getSources()))
                .collectedAt(tag.getCollectedAt())
                .build();
    }

    private static List<String> parseList(String json) {
        if (json == null || json.isBlank()) return List.of();
        String trimmed = json.trim().replaceAll("^\\[|]$", "");
        if (trimmed.isBlank()) return List.of();
        return Arrays.stream(trimmed.split(","))
                .map(s -> s.trim().replaceAll("^\"|\"$", ""))
                .filter(s -> !s.isBlank())
                .toList();
    }
}
