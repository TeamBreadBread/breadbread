package com.breadbread.course.entity;

import com.breadbread.course.converter.CoordinateListConverter;
import com.breadbread.course.dto.Coordinate;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.util.List;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "course_driving_route")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CourseDrivingRoute {

    @Id private Long courseId;

    @Convert(converter = CoordinateListConverter.class)
    @Column(columnDefinition = "text", nullable = false)
    private List<Coordinate> path;

    @Builder
    public CourseDrivingRoute(Long courseId, List<Coordinate> path) {
        this.courseId = courseId;
        this.path = path;
    }
}
