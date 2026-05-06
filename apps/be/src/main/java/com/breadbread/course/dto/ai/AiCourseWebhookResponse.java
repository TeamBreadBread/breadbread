package com.breadbread.course.dto.ai;

import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@NoArgsConstructor
public class AiCourseWebhookResponse {
	private String name;
	private String theme;
	private Integer estimatedCost;
	private String estimatedTime;
	private String summary;
	private String recommendReason;
	private List<Long> bakeryIds;
	private List<RecommendedBakeryResponse> bakeries;
}

