package com.breadbread.course.dto.response;

import com.breadbread.course.dto.route.Coordinate;
import java.util.List;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class DrivingRouteResponse {

    private List<Coordinate> path;

    /** 구간별 이동 시간 (분). 제공자가 지원하지 않으면 빈 리스트. */
    private List<Integer> legs;

    /** 빵집별 예상 체류 시간 (분). 방문 순서와 동일. */
    private List<Integer> stayMinutesPerBakery;

    /** 총 이동 시간 (분). */
    private int totalTravelMinutes;

    /** 빵집 체류 시간 합계 (분). */
    private int totalStayMinutes;

    /** 총 예상 소요 시간 (분) = totalTravelMinutes + totalStayMinutes. */
    private int totalMinutes;
}
