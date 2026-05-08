package com.breadbread.course.dto;

import com.breadbread.bakery.entity.BreadType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class ManualCourseRequest {

    @NotBlank private String name;
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
    @NotEmpty private List<Long> bakeryIds;
}
