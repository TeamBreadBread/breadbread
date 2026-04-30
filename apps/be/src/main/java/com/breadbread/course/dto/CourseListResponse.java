package com.breadbread.course.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class CourseListResponse {
    private List<CourseSummaryResponse> courses;
    private int total;
	private int page;
	private int size;
	private boolean hasNext;
}
