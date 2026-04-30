package com.breadbread.course.entity;

import jakarta.persistence.Embeddable;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Embeddable
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AiCourseInfo {

    @Enumerated(EnumType.STRING)
    private TravelType travelType;  // 여행 유형

    @Enumerated(EnumType.STRING)
    private BudgetRange budgetRange;    // 예산

    private boolean minimizeRoute;  // 코스 동선

    private double latitude;    // 출발 위치
    private double longitude;

    private boolean waitingPreference;  // 웨이팅 선호

    private boolean drinkPreference;    // 음료 파는 곳

    private int bakeryCount;            // 추천 빵집 수

    @Enumerated(EnumType.STRING)
    private FlexibilityLevel flexibilityLevel;  // 일정 유연성

    @Builder
     public AiCourseInfo(TravelType travelType, BudgetRange budgetRange,
                         boolean waitingPreference, boolean drinkPreference,
                         int bakeryCount, FlexibilityLevel flexibilityLevel,
                         boolean minimizeRoute, double latitude, double longitude) {
        this.travelType = travelType;
        this.budgetRange = budgetRange;
        this.waitingPreference = waitingPreference;
        this.drinkPreference = drinkPreference;
        this.bakeryCount = bakeryCount;
        this.flexibilityLevel = flexibilityLevel;
        this.minimizeRoute = minimizeRoute;
        this.latitude = latitude;
        this.longitude = longitude;
    }
}
