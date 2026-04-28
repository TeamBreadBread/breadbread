package com.breadbread.course.dto;

import com.breadbread.bakery.entity.BreadType;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@NoArgsConstructor
public class ManualCourseRequest {

    private String name;
    private String thumbnailUrl;
    private String estimatedTime;
    private Integer estimatedCost;

    // ManualCourseInfo
    private boolean editorPick;
    private String region;
    private String theme;
    private BreadType breadType;

    // CourseBakeries
    private List<Long> bakeryIds;

}
