package com.breadbread.tour.dto;

import com.breadbread.tour.redis.TourStateCache;
import com.breadbread.tour.redis.TourStatus;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class TourStartResponse {

    private Long courseId;
    private int totalBakeryCount;
    private TourStatus status;

    public static TourStartResponse from(TourStateCache state) {
        return TourStartResponse.builder()
                .courseId(state.getCourseId())
                .totalBakeryCount(state.getTotalBakeryCount())
                .status(state.getStatus())
                .build();
    }
}
