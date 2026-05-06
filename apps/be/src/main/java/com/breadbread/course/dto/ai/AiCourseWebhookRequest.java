package com.breadbread.course.dto.ai;

import com.breadbread.bakery.dto.BakeryAiResponse;
import com.breadbread.user.dto.PreferenceResponse;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class AiCourseWebhookRequest {
	private PreferenceResponse userPreference;
	private AiCourseRequest aiCourseRequest;
	private List<BakeryAiResponse> bakeries;
}
