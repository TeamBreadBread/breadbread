package com.breadbread.course.dto.response;

import com.breadbread.bakery.dto.response.BakeryCourseSummaryResponse;
import com.breadbread.course.entity.Course;
import java.util.List;
import lombok.Builder;
import lombok.Getter;

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
    private boolean isSaved;
    private String theme;
    private List<BakeryCourseSummaryResponse> bakeries;

    public static CourseSummaryResponse from(
            Course course,
            int likeCount,
            boolean liked,
            boolean isSaved,
            List<BakeryCourseSummaryResponse> bakeries) {
        return CourseSummaryResponse.builder()
                .id(course.getId())
                .name(course.getName())
                .thumbnailUrl(course.getThumbnailUrl())
                .bakeryCount(course.getCourseBakeries().size())
                .estimatedTime(course.getEstimatedTime())
                .estimatedCost(course.getEstimatedCost())
                .likeCount(likeCount)
                .liked(liked)
                .isSaved(isSaved)
                .theme(course.getTheme())
                .bakeries(bakeries)
                .build();
    }
}
