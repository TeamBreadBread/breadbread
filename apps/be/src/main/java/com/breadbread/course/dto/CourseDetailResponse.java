package com.breadbread.course.dto;

import com.breadbread.bakery.dto.BakerySummaryResponse;
import com.breadbread.course.entity.Course;
import java.util.List;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class CourseDetailResponse {
    private Long id;
    private String name;
    private String thumbnailUrl;
    private int bakeryCount;
    private String estimatedTime;
    private Long estimatedCost;
    private int likeCount;
    private boolean liked;
    private List<BakerySummaryResponse> bakeries;

    public static CourseDetailResponse from(
            Course course, int likeCount, boolean liked, List<BakerySummaryResponse> bakeries) {
        return CourseDetailResponse.builder()
                .id(course.getId())
                .name(course.getName())
                .thumbnailUrl(course.getThumbnailUrl())
                .bakeryCount(course.getCourseBakeries().size())
                .estimatedTime(course.getEstimatedTime())
                .estimatedCost(course.getEstimatedCost())
                .likeCount(likeCount)
                .liked(liked)
                .bakeries(bakeries)
                .build();
    }
}
