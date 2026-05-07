package com.breadbread.course.dto;

import com.breadbread.bakery.entity.BreadType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@NoArgsConstructor
public class ManualCourseRequest {

    @NotBlank
    private String name;
    private String thumbnailUrl;
    private String estimatedTime;

    @Min(0)
    private Long estimatedCost;

    // ManualCourseInfo
    private boolean editorPick;
    private String region;
    private String theme;
    private BreadType breadType;

    // CourseBakeries
    @NotEmpty
    private List<Long> bakeryIds;

}
