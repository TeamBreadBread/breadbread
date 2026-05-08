package com.breadbread.course.dto.ai;

import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class AiCourseWebhookResponse {
    private String name;
    private String theme;
    private Long estimatedCost;
    private String estimatedTime;
    private String summary;
    private String recommendReason;
    private List<Long> bakeryIds;
    private List<RecommendedBakeryResponse> bakeries;
}
