package com.breadbread.course.dto.response;

import java.util.List;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AiCourseAdminListResponse {
    private List<AiCourseAdminResponse> courses;
    private int total;
    private int page;
    private int size;
    private boolean hasNext;
}
