package com.breadbread.course.client;

import com.breadbread.course.dto.Coordinate;
import com.breadbread.course.dto.RouteResult;
import java.util.List;

public interface DrivingRouteClient {

    RouteResult getPath(List<Coordinate> coordinates);
}
