package com.breadbread.tour.dto;

import com.breadbread.tour.redis.TourStateCache;
import com.breadbread.tour.redis.TourStatus;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class TourVisitResponse {

    private Long courseId;
    private int currentVisitOrder;
    private int remainingCount;
    private TourStatus status;

    public static TourVisitResponse from(TourStateCache state) {
        return TourVisitResponse.builder()
                .courseId(state.getCourseId())
                .currentVisitOrder(state.getCurrentVisitOrder())
                .remainingCount(state.getTotalBakeryCount() - state.getCurrentVisitOrder())
                .status(state.getStatus())
                .build();
    }
}
