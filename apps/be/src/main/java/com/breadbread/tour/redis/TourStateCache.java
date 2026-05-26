package com.breadbread.tour.redis;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TourStateCache {

    private Long userId;
    private Long courseId;
    private int totalBakeryCount;
    private int currentVisitOrder; // 완료한 방문 수
    private TourStatus status;
    private String startedAt; // ISO-8601 문자열
}
