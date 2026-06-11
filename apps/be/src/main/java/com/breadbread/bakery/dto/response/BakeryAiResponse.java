package com.breadbread.bakery.dto.response;

import com.breadbread.bakery.entity.*;
import com.breadbread.bakery.entity.enums.BakeryPersonality;
import com.breadbread.bakery.entity.enums.BakeryUseType;
import com.breadbread.bakery.entity.enums.DayType;
import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class BakeryAiResponse {

    private Long id;
    private String name;
    private String region;
    private Double lat;
    private Double lng;
    private String note;
    private Double rating;
    private boolean dineInAvailable;
    private boolean parkingAvailable;
    private boolean drinkAvailable;
    private int estimatedStayMinutes;
    private String bakeryType;
    private LocalTime appearanceTime;
    private String frequency;
    private Set<String> closedDays;
    private String closedDayNote;
    private Set<String> crowdedDays;
    private List<String> useTypes;
    private List<String> personalities;
    private LocalTime weekdayOpen;
    private LocalTime weekdayClose;
    private LocalTime weekendOpen;
    private LocalTime weekendClose;
    private String lastOrderTime;
    private boolean holidayClosed;
    private List<BreadInfo> breads;
    private List<CrowdTimeInfo> crowdTimes;

    public static BakeryAiResponse from(
            Bakery bakery, List<Bread> breads, List<CrowdTime> crowdTimes, DayType dayType) {
        BusinessHours bh = bakery.getBusinessHours();
        boolean showWeekday = dayType == null || dayType == DayType.WEEKDAY;
        boolean showWeekend = dayType == null || dayType == DayType.WEEKEND;
        return BakeryAiResponse.builder()
                .id(bakery.getId())
                .name(bakery.getName())
                .region(bakery.getRegion())
                .lat(bakery.getLatitude())
                .lng(bakery.getLongitude())
                .note(bakery.getNote())
                .rating(bakery.getRating())
                .dineInAvailable(bakery.isDineInAvailable())
                .parkingAvailable(bakery.isParkingAvailable())
                .drinkAvailable(bakery.isDrinkAvailable())
                .estimatedStayMinutes(bakery.getEstimatedStayMinutes())
                .bakeryType(bakery.getBakeryType() != null ? bakery.getBakeryType().name() : null)
                .appearanceTime(bakery.getAppearanceTime())
                .frequency(bakery.getFrequency() != null ? bakery.getFrequency().name() : null)
                .closedDays(
                        bakery.getClosedDays().stream()
                                .map(DayOfWeek::name)
                                .collect(Collectors.toSet()))
                .closedDayNote(bh != null ? bh.getClosedDayNote() : null)
                .crowdedDays(
                        bakery.getCrowdedDays().stream()
                                .map(DayOfWeek::name)
                                .collect(Collectors.toSet()))
                .useTypes(bakery.getBakeryUseTypes().stream().map(BakeryUseType::name).toList())
                .personalities(
                        bakery.getBakeryPersonalities().stream()
                                .map(BakeryPersonality::name)
                                .toList())
                .weekdayOpen(showWeekday && bh != null ? bh.getWeekdayOpen() : null)
                .weekdayClose(showWeekday && bh != null ? bh.getWeekdayClose() : null)
                .weekendOpen(showWeekend && bh != null ? bh.getWeekendOpen() : null)
                .weekendClose(showWeekend && bh != null ? bh.getWeekendClose() : null)
                .lastOrderTime(bh != null ? bh.getLastOrderTime() : null)
                .holidayClosed(bh != null && bh.isHolidayClosed())
                .breads(breads.stream().map(BreadInfo::from).toList())
                .crowdTimes(crowdTimes.stream().map(CrowdTimeInfo::from).toList())
                .build();
    }

    @Getter
    @Builder
    public static class BreadInfo {
        private Long id;
        private String name;
        private int price;
        private String breadType;
        private boolean signature;
        private boolean estimatedSoldOut;
        private int selloutMin;

        public static BreadInfo from(Bread bread) {
            return BreadInfo.builder()
                    .id(bread.getId())
                    .name(bread.getName())
                    .price(bread.getPrice())
                    .breadType(bread.getBreadType() != null ? bread.getBreadType().name() : null)
                    .signature(bread.isSignature())
                    .estimatedSoldOut(bread.isEstimatedSoldOut())
                    .selloutMin(bread.getSelloutMin())
                    .build();
        }
    }

    @Getter
    @Builder
    public static class CrowdTimeInfo {
        private String dayType;
        private LocalTime peakStart;
        private LocalTime peakEnd;
        private String crowdLevel;
        private Integer expectedWaitMin;

        public static CrowdTimeInfo from(CrowdTime crowdTime) {
            return CrowdTimeInfo.builder()
                    .dayType(crowdTime.getDayType() != null ? crowdTime.getDayType().name() : null)
                    .peakStart(crowdTime.getPeakStart())
                    .peakEnd(crowdTime.getPeakEnd())
                    .crowdLevel(
                            crowdTime.getCrowdLevel() != null
                                    ? crowdTime.getCrowdLevel().name()
                                    : null)
                    .expectedWaitMin(crowdTime.getExpectedWaitMin())
                    .build();
        }
    }
}
