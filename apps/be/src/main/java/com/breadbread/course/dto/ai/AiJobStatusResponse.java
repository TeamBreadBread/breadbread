package com.breadbread.course.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class AiJobStatusResponse {
    private AiJobStatus status;
    private Long courseId;
    private String errorMessage;
}
