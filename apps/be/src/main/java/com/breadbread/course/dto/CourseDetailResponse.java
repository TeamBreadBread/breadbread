package com.breadbread.course.dto;

import com.breadbread.bakery.dto.BakerySummaryResponse;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class CourseDetailResponse {
    private Long id;
    private String name;
    private String thumbnailUrl;
    private int bakeryCount;
    private String estimatedTime;
    private Integer estimatedCost;
    private int likeCount;
    private List<BakerySummaryResponse> bakeries;
}
