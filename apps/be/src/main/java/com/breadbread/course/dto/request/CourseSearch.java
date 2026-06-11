package com.breadbread.course.dto.request;

import com.breadbread.bakery.entity.enums.BreadType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseSearch {
    private String region;
    private BreadType breadType;
    private String theme;
    private Boolean editorPick;
}
