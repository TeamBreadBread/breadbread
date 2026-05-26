package com.breadbread.tour.dto;

import com.breadbread.tour.redis.TourStateCache;
import com.breadbread.tour.redis.TourStatus;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class TourCurrentResponse {

    private Long courseId;
    private int currentVisitOrder;
    private int remainingCount;
    private TourStatus status;
    private String startedAt;

    public static TourCurrentResponse from(TourStateCache state) {
        return TourCurrentResponse.builder()
                .courseId(state.getCourseId())
                .currentVisitOrder(state.getCurrentVisitOrder())
                .remainingCount(state.getTotalBakeryCount() - state.getCurrentVisitOrder())
                .status(state.getStatus())
                .startedAt(state.getStartedAt())
                .build();
    }
}
