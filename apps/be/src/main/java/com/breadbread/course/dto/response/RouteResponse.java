package com.breadbread.course.dto.response;

import com.breadbread.course.entity.Course;
import com.breadbread.course.entity.CourseBakery;
import com.breadbread.course.entity.CourseType;
import com.breadbread.course.service.ai.AiCourseNameResolver;
import java.util.Comparator;
import java.util.List;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class RouteResponse {
    private Long courseId;
    private String name;
    private String estimatedTime;
    private int bakeryCount;
    private List<String> bakeryNames;

    public static RouteResponse from(Course course) {
        List<String> bakeryNames =
                course.getCourseBakeries().stream()
                        .sorted(Comparator.comparingInt(CourseBakery::getVisitOrder))
                        .map(cb -> cb.getBakery().getName())
                        .toList();

        return RouteResponse.builder()
                .courseId(course.getId())
                .name(displayName(course))
                .estimatedTime(course.getEstimatedTime())
                .bakeryCount(bakeryNames.size())
                .bakeryNames(bakeryNames)
                .build();
    }

    private static String displayName(Course course) {
        if (course.getCourseType() == CourseType.AI) {
            return AiCourseNameResolver.resolve(course);
        }
        return course.getName();
    }
}
