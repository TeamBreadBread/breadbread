package com.breadbread.trend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class TrendDiscoverRequest {

    @NotBlank private String keyword;

    private Double trendScore;

    private String trendStatus;

    private Double growthRate;

    private Long bakeryId;

    private String bakeryName;

    private List<String> matchedMenus;

    private List<String> source;

    @NotNull private OffsetDateTime collectedAt;

    public LocalDateTime getCollectedAt() {
        return collectedAt == null ? null : collectedAt.toLocalDateTime();
    }
}
