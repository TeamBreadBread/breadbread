package com.breadbread.course.dto;

import com.breadbread.course.entity.Course;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class CourseSummaryResponse {
    private Long id;
    private String name;
    private String thumbnailUrl;
    private int bakeryCount;
    private String estimatedTime;
    private Long estimatedCost;
    private int likeCount;
    private boolean liked;
    private List<CourseBakerySummary> bakeries;

    public static CourseSummaryResponse from(Course course, int likeCount, boolean liked, List<CourseBakerySummary> bakeries) {
        return CourseSummaryResponse.builder()
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
