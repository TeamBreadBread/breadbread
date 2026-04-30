package com.breadbread.course.dto;

import com.breadbread.bakery.entity.BreadType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@NoArgsConstructor
public class UpdateCourseRequest {

    @Size(min = 1)
    private String name;
    private String thumbnailUrl;
    private String estimatedTime;

    @Min(0)
    private Integer estimatedCost;

    // ManualCourseInfo
    private Boolean editorPick;
    private String region;
    private String theme;
    private BreadType breadType;

    // CourseBakeries
    @Size(min = 1)
    private List<Long> bakeryIds;
}
