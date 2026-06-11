package com.breadbread.course.entity;

import com.breadbread.course.converter.CoordinateListConverter;
import com.breadbread.course.converter.IntegerListConverter;
import com.breadbread.course.dto.route.Coordinate;
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

    /** 총 이동 시간 (초). 아직 저장되지 않은 레코드는 null일 수 있음. */
    @Column(name = "total_travel_seconds")
    private Integer totalTravelSeconds;

    /** 구간별 이동 시간 (초). 제공자가 지원하지 않으면 빈 리스트. */
    @Convert(converter = IntegerListConverter.class)
    @Column(name = "leg_durations", columnDefinition = "text")
    private List<Integer> legDurations;

    @Builder
    public CourseDrivingRoute(
            Long courseId,
            List<Coordinate> path,
            Integer totalTravelSeconds,
            List<Integer> legDurations) {
        this.courseId = courseId;
        this.path = path;
        this.totalTravelSeconds = totalTravelSeconds;
        this.legDurations = legDurations;
    }
}
