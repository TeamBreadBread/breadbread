package com.breadbread.course.dto.response;

import com.breadbread.bakery.dto.response.BakerySummaryResponse;
import com.breadbread.course.entity.Course;
import com.breadbread.course.entity.CourseType;
import com.breadbread.course.service.ai.AiCourseNameResolver;
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
    private boolean isSaved;
    private String recommendReason;
    private List<BakerySummaryResponse> bakeries;

    public static CourseDetailResponse from(
            Course course,
            int likeCount,
            boolean liked,
            boolean isSaved,
            List<BakerySummaryResponse> bakeries) {
        return CourseDetailResponse.builder()
                .id(course.getId())
                .name(displayName(course))
                .thumbnailUrl(course.getThumbnailUrl())
                .bakeryCount(course.getCourseBakeries().size())
                .estimatedTime(course.getEstimatedTime())
                .estimatedCost(course.getEstimatedCost())
                .likeCount(likeCount)
                .liked(liked)
                .isSaved(isSaved)
                .recommendReason(
                        course.getAiCourseInfo() != null
                                ? course.getAiCourseInfo().getRecommendReason()
                                : null)
                .bakeries(bakeries)
                .build();
    }

    private static String displayName(Course course) {
        if (course.getCourseType() == CourseType.AI) {
            return AiCourseNameResolver.resolve(course);
        }
        return course.getName();
    }
}
