package com.breadbread.course.dto;

import com.breadbread.bakery.entity.BreadType;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class CourseSearch {
    private String region;
    private BreadType breadType;
    private String theme;
    private Boolean editorPick;
}
