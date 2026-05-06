package com.breadbread.course.dto.ai;

import com.breadbread.bakery.dto.BakeryAiResponse;
import com.breadbread.user.dto.PreferenceResponse;
import lombok.Builder;
import lombok.Getter;
import lombok.ToString;

import java.util.List;

@Getter
@Builder
public class AiCourseWebhookRequest {
	@ToString.Exclude
	private PreferenceResponse userPreference;
	@ToString.Exclude
	private AiCourseRequest aiCourseRequest;
	private List<BakeryAiResponse> bakeries;
}
