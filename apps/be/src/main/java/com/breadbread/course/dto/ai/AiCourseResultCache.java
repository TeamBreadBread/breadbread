package com.breadbread.course.dto.ai;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = {"request", "response"})
@JsonIgnoreProperties(ignoreUnknown = true)
public class AiCourseResultCache {
    private Long userId;
    private AiCourseRequest request;
    private AiCourseWebhookResponse response;
}
