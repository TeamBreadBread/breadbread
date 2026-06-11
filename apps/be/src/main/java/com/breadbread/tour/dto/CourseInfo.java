package com.breadbread.tour.dto;

import com.breadbread.bakery.entity.enums.BakeryPersonality;
import com.breadbread.bakery.entity.enums.BakeryType;
import com.breadbread.bakery.entity.enums.BakeryUseType;
import com.breadbread.bakery.entity.enums.BreadType;
import com.breadbread.course.entity.AiCourseInfo;
import com.breadbread.course.entity.BudgetRange;
import com.breadbread.course.entity.Course;
import com.breadbread.course.entity.CourseBakery;
import com.breadbread.course.entity.FlexibilityLevel;
import com.breadbread.course.entity.ManualCourseInfo;
import com.breadbread.course.entity.TravelType;
import com.breadbread.user.entity.UserPreference;
import com.breadbread.user.entity.WaitingTolerance;
import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class CourseInfo {

    private Long courseId;
    private String name;
    private String courseType;
    private String region;
    private String theme;
    private String summary;
    private Long estimatedCost;
    private String estimatedTime;
    private Integer totalMinutes;
    private List<Long> bakeries;
    private ManualInfo manualCourseInfo;
    private AiInfo aiCourseInfo;

    public static CourseInfo from(Course course, List<CourseBakery> courseBakeries) {
        ManualCourseInfo manual = course.getManualCourseInfo();
        AiCourseInfo ai = course.getAiCourseInfo();

        List<Long> bakeryIds =
                courseBakeries.stream()
                        .sorted(Comparator.comparingInt(CourseBakery::getVisitOrder))
                        .map(cb -> cb.getBakery().getId())
                        .toList();

        return CourseInfo.builder()
                .courseId(course.getId())
                .name(course.getName())
                .courseType(course.getCourseType().name())
                .region(course.getRegion())
                .theme(course.getTheme())
                .summary(course.getSummary())
                .estimatedCost(course.getEstimatedCost())
                .estimatedTime(course.getEstimatedTime())
                .totalMinutes(course.getTotalMinutes())
                .bakeries(bakeryIds)
                .manualCourseInfo(manual != null ? ManualInfo.from(manual) : null)
                .aiCourseInfo(ai != null ? AiInfo.from(course) : null)
                .build();
    }

    @Getter
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ManualInfo {
        private boolean editorPick;
        private String breadType;

        public static ManualInfo from(ManualCourseInfo info) {
            return ManualInfo.builder()
                    .editorPick(info.isEditorPick())
                    .breadType(info.getBreadType() != null ? info.getBreadType().name() : null)
                    .build();
        }
    }

    @Getter
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class AiInfo {
        private TravelType travelType;
        private BudgetRange budgetRange;
        private boolean minimizeRoute;
        private double latitude;
        private double longitude;
        private boolean waitingPreference;
        private boolean drinkPreference;
        private int bakeryCount;
        private String recommendReason;
        private FlexibilityLevel flexibilityLevel;
        private Set<BreadType> preferredBreadTypes;
        private UserPreferenceInfo userPreference;

        public static AiInfo from(Course course) {
            AiCourseInfo info = course.getAiCourseInfo();
            UserPreference pref = course.getUserPreference();

            return AiInfo.builder()
                    .travelType(info.getTravelType())
                    .budgetRange(info.getBudgetRange())
                    .minimizeRoute(info.isMinimizeRoute())
                    .latitude(info.getLatitude())
                    .longitude(info.getLongitude())
                    .waitingPreference(info.isWaitingPreference())
                    .drinkPreference(info.isDrinkPreference())
                    .bakeryCount(info.getBakeryCount())
                    .recommendReason(info.getRecommendReason())
                    .flexibilityLevel(info.getFlexibilityLevel())
                    .preferredBreadTypes(
                            course.getPreferredBreadTypes().isEmpty()
                                    ? null
                                    : course.getPreferredBreadTypes())
                    .userPreference(pref != null ? UserPreferenceInfo.from(pref) : null)
                    .build();
        }
    }

    @Getter
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class UserPreferenceInfo {
        private List<BakeryType> bakeryTypes;
        private List<BakeryPersonality> bakeryMoods;
        private List<BakeryUseType> bakeryUseTypes;
        private WaitingTolerance waitingTolerance;

        public static UserPreferenceInfo from(UserPreference pref) {
            return UserPreferenceInfo.builder()
                    .bakeryTypes(pref.getBakeryTypes().isEmpty() ? null : pref.getBakeryTypes())
                    .bakeryMoods(pref.getBakeryMoods().isEmpty() ? null : pref.getBakeryMoods())
                    .bakeryUseTypes(
                            pref.getBakeryUseTypes().isEmpty() ? null : pref.getBakeryUseTypes())
                    .waitingTolerance(pref.getWaitingTolerance())
                    .build();
        }
    }
}
