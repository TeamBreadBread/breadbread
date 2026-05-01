package com.breadbread.course.dto;

import com.breadbread.course.entity.Course;
import com.breadbread.course.entity.CourseBakery;
import lombok.Builder;
import lombok.Getter;

import java.util.Comparator;
import java.util.List;

@Getter
@Builder
public class RouteResponse {
    private Long courseId;
    private String name;
    private String estimatedTime;
    private int bakeryCount;
    private List<String> bakeryNames;

    public static RouteResponse from(Course course) {
        List<String> bakeryNames = course.getCourseBakeries().stream()
                .sorted(Comparator.comparingInt(CourseBakery::getVisitOrder))
                .map(cb -> cb.getBakery().getName())
                .toList();

        return RouteResponse.builder()
                .courseId(course.getId())
                .name(course.getName())
                .estimatedTime(course.getEstimatedTime())
                .bakeryCount(bakeryNames.size())
                .bakeryNames(bakeryNames)
                .build();
    }
}
