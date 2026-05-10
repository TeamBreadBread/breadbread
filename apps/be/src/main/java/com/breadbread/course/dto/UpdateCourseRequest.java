package com.breadbread.course.dto;

import com.breadbread.bakery.entity.BreadType;
import com.breadbread.global.validation.NotBlankIfPresent;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class UpdateCourseRequest {

    @NotBlankIfPresent private String name;

    @NotBlankIfPresent private String thumbnailUrl;

    @NotBlankIfPresent private String estimatedTime;

    @Min(0)
    private Long estimatedCost;

    // ManualCourseInfo
    private Boolean editorPick;
    @NotBlankIfPresent private String region;

    @NotBlankIfPresent private String theme;
    private BreadType breadType;

    // CourseBakeries
    @Size(min = 1)
    private List<Long> bakeryIds;
}
