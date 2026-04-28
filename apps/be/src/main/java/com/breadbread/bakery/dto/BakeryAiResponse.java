package com.breadbread.bakery.dto;

import com.breadbread.bakery.entity.*;
import lombok.Builder;
import lombok.Getter;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Getter
@Builder
public class BakeryAiResponse {

    private Long id;
    private String name;
    private String address;
    private String region;
    private Double lat;
    private Double lng;
    private String phone;
    private String mapLink;
    private String note;
    private Integer rating;
    private boolean dineInAvailable;
    private boolean parkingAvailable;
    private boolean drinkAvailable;
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
    private List<String> imageUrls;

    public static BakeryAiResponse from(Bakery bakery, List<Bread> breads, List<CrowdTime> crowdTimes) {
        BusinessHours bh = bakery.getBusinessHours();
        return BakeryAiResponse.builder()
                .id(bakery.getId())
                .name(bakery.getName())
                .address(bakery.getAddress())
                .region(bakery.getRegion())
                .lat(bakery.getLatitude())
                .lng(bakery.getLongitude())
                .phone(bakery.getPhone())
                .mapLink(bakery.getMapLink())
                .note(bakery.getNote())
                .rating(bakery.getRating())
                .dineInAvailable(bakery.isDineInAvailable())
                .parkingAvailable(bakery.isParkingAvailable())
                .drinkAvailable(bakery.isDrinkAvailable())
                .bakeryType(bakery.getBakeryType() != null ? bakery.getBakeryType().name() : null)
                .appearanceTime(bakery.getAppearanceTime())
                .frequency(bakery.getFrequency() != null ? bakery.getFrequency().name() : null)
                .closedDays(bakery.getClosedDays().stream()
                        .map(DayOfWeek::name)
                        .collect(Collectors.toSet()))
                .closedDayNote(bh != null ? bh.getClosedDayNote() : null)
                .crowdedDays(bakery.getCrowdedDays().stream()
                        .map(DayOfWeek::name)
                        .collect(Collectors.toSet()))
                .useTypes(bakery.getBakeryUseTypes().stream()
                        .map(BakeryUseType::name)
                        .toList())
                .personalities(bakery.getBakeryPersonalities().stream()
                        .map(BakeryPersonality::name)
                        .toList())
                .weekdayOpen(bh != null ? bh.getWeekdayOpen() : null)
                .weekdayClose(bh != null ? bh.getWeekdayClose() : null)
                .weekendOpen(bh != null ? bh.getWeekendOpen() : null)
                .weekendClose(bh != null ? bh.getWeekendClose() : null)
                .lastOrderTime(bh != null ? bh.getLastOrderTime() : null)
                .holidayClosed(bh != null && bh.isHolidayClosed())
                .breads(breads.stream().map(BreadInfo::from).toList())
                .crowdTimes(crowdTimes.stream().map(CrowdTimeInfo::from).toList())
                .imageUrls(bakery.getImages().stream()
                        .sorted(Comparator.comparingInt(BakeryImage::getDisplayOrder))
                        .map(BakeryImage::getImageUrl)
                        .toList())
                .build();
    }

    @Getter
    @Builder
    public static class BreadInfo {
        private String name;
        private int price;
        private String breadType;
        private boolean signature;
        private boolean estimatedSoldOut;
        private int selloutMin;

        public static BreadInfo from(Bread bread) {
            return BreadInfo.builder()
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
                    .crowdLevel(crowdTime.getCrowdLevel() != null ? crowdTime.getCrowdLevel().name() : null)
                    .expectedWaitMin(crowdTime.getExpectedWaitMin())
                    .build();
        }
    }
}
