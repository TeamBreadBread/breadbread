package com.breadbread.course.client;

import com.breadbread.course.dto.route.Coordinate;
import com.breadbread.course.dto.route.RouteResult;
import java.util.List;

public interface WalkingRouteClient {

    RouteResult getPath(List<Coordinate> coordinates);
}
