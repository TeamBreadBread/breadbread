package com.breadbread.course.dto.ai;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiCoursePreviewResponse {
    private String name;
    private int bakeryCount;
    private String estimatedTime;
    private Long estimatedCost;
    private String theme;
    private String summary;
    private String recommendReason;
    private List<RecommendedBakeryResponse> bakeries;

    public static AiCoursePreviewResponse from(AiCourseWebhookResponse response) {
        return AiCoursePreviewResponse.builder()
                .name(response.getName())
                .bakeryCount(response.getBakeries() != null ? response.getBakeries().size() : 0)
                .estimatedTime(response.getEstimatedTime())
                .estimatedCost(response.getEstimatedCost())
                .theme(response.getTheme())
                .summary(response.getSummary())
                .recommendReason(response.getRecommendReason())
                .bakeries(response.getBakeries())
                .build();
    }
}
