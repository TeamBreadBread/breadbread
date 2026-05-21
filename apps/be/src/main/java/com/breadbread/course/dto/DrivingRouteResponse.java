package com.breadbread.course.dto;

import java.util.List;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class DrivingRouteResponse {

    private List<Coordinate> path;
}
