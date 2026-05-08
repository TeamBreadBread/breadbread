package com.breadbread.course.dto;

import java.util.List;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class CourseListResponse {
    private List<CourseSummaryResponse> courses;
    private int total;
    private int page;
    private int size;
    private boolean hasNext;
}
