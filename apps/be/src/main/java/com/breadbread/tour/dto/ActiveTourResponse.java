package com.breadbread.tour.dto;

import java.util.List;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ActiveTourResponse {

    private Long userId;
    private Long courseId;
    private List<Long> bakeryIds;
    private int currentVisitOrder;
    private String status; // IN_PROGRESS | PRE_DEPARTURE
    private String startedAt;
}
