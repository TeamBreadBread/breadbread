package com.breadbread.course.client;

import com.breadbread.course.dto.Coordinate;
import java.util.List;

public interface DrivingRouteClient {

    List<Coordinate> getPath(List<Coordinate> coordinates);
}
