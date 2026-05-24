package com.breadbread.course.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class RouteResult {

    private List<Coordinate> path;

    private List<Integer> legDurationsSeconds;

    private int totalDurationSeconds;
}
