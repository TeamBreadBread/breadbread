package com.breadbread.course.dto;

import com.breadbread.bakery.entity.BreadType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class UpdateCourseRequest {

    @Size(min = 1)
    private String name;

    private String thumbnailUrl;
    private String estimatedTime;

    @Min(0)
    private Long estimatedCost;

    // ManualCourseInfo
    private Boolean editorPick;
    private String region;
    private String theme;
    private BreadType breadType;

    // CourseBakeries
    @Size(min = 1)
    private List<Long> bakeryIds;
}
