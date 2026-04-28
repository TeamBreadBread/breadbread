package com.breadbread.course.dto;

import com.breadbread.bakery.entity.BreadType;
import com.breadbread.course.entity.BudgetRange;
import com.breadbread.course.entity.FlexibilityLevel;
import com.breadbread.course.entity.TravelType;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@NoArgsConstructor
public class AiCourseRequest {
    private TravelType travelType;
    private BudgetRange budgetRange;
    private boolean minimizeRoute;
    private List<BreadType> breadTypes;
    private Double latitude;
    private Double longitude;
    private boolean waitingPreference;
    private boolean drinkPreference;
    private int bakeryCount;
    private FlexibilityLevel flexibilityLevel;
}
