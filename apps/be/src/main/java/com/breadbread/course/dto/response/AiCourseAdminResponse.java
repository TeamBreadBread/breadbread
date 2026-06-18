package com.breadbread.course.dto.response;

import com.breadbread.bakery.entity.enums.BakeryPersonality;
import com.breadbread.bakery.entity.enums.BakeryType;
import com.breadbread.bakery.entity.enums.BakeryUseType;
import com.breadbread.bakery.entity.enums.BreadType;
import com.breadbread.course.dto.ai.RecommendedBakeryResponse;
import com.breadbread.course.entity.AiCourseInfo;
import com.breadbread.course.entity.BudgetRange;
import com.breadbread.course.entity.Course;
import com.breadbread.course.entity.CourseBakery;
import com.breadbread.course.entity.FlexibilityLevel;
import com.breadbread.course.entity.TravelType;
import com.breadbread.user.entity.WaitingTolerance;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AiCourseAdminResponse {
    private Long id;
    private Long userId;

    private Input input;
    private Result result;

    @Getter
    @Builder
    public static class Input {
        private TravelType travelType;
        private BudgetRange budgetRange;
        private FlexibilityLevel flexibilityLevel;
        private boolean minimizeRoute;
        private boolean waitingPreference;
        private boolean drinkPreference;
        private int bakeryCount;
        private double latitude;
        private double longitude;
        private Set<BreadType> preferredBreadTypes;
        private PreferenceSnapshot userPreference;

        @Getter
        @Builder
        public static class PreferenceSnapshot {
            private List<BakeryType> bakeryTypes;
            private List<BakeryPersonality> bakeryMoods;
            private List<BakeryUseType> bakeryUseTypes;
            private WaitingTolerance waitingTolerance;
        }
    }

    @Getter
    @Builder
    public static class Result {
        private String name;
        private String theme;
        private String summary;
        private String estimatedTime;
        private Long estimatedCost;
        private String recommendReason;
        private List<RecommendedBakeryResponse> bakeries;
    }

    public static AiCourseAdminResponse from(Course course) {
        AiCourseInfo ai = course.getAiCourseInfo();

        Input input =
                ai != null
                        ? Input.builder()
                                .travelType(ai.getTravelType())
                                .budgetRange(ai.getBudgetRange())
                                .flexibilityLevel(ai.getFlexibilityLevel())
                                .minimizeRoute(ai.isMinimizeRoute())
                                .waitingPreference(ai.isWaitingPreference())
                                .drinkPreference(ai.isDrinkPreference())
                                .bakeryCount(ai.getBakeryCount())
                                .latitude(ai.getLatitude())
                                .longitude(ai.getLongitude())
                                .preferredBreadTypes(course.getPreferredBreadTypes())
                                .userPreference(
                                        Input.PreferenceSnapshot.builder()
                                                .bakeryTypes(course.getSnapshotBakeryTypes())
                                                .bakeryMoods(course.getSnapshotBakeryMoods())
                                                .bakeryUseTypes(course.getSnapshotBakeryUseTypes())
                                                .waitingTolerance(
                                                        course.getSnapshotWaitingTolerance())
                                                .build())
                                .build()
                        : null;

        List<RecommendedBakeryResponse> bakeries =
                course.getCourseBakeries().stream()
                        .sorted(Comparator.comparingInt(CourseBakery::getVisitOrder))
                        .map(RecommendedBakeryResponse::from)
                        .toList();

        Result result =
                Result.builder()
                        .name(course.getName())
                        .theme(course.getTheme())
                        .summary(course.getSummary())
                        .estimatedTime(course.getEstimatedTime())
                        .estimatedCost(course.getEstimatedCost())
                        .recommendReason(ai != null ? ai.getRecommendReason() : null)
                        .bakeries(bakeries)
                        .build();

        return AiCourseAdminResponse.builder()
                .id(course.getId())
                .userId(course.getUser() != null ? course.getUser().getId() : null)
                .input(input)
                .result(result)
                .build();
    }
}
