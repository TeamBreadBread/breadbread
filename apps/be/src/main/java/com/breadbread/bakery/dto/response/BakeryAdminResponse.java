package com.breadbread.bakery.dto.response;

import com.breadbread.bakery.entity.Bakery;
import com.breadbread.bakery.entity.Bread;
import com.breadbread.bakery.entity.BusinessHours;
import com.breadbread.bakery.entity.CrowdTime;
import com.breadbread.bakery.entity.enums.BakeryPersonality;
import com.breadbread.bakery.entity.enums.BakeryStatus;
import com.breadbread.bakery.entity.enums.BakeryUseType;
import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class BakeryAdminResponse {

    private Long id;
    private String name;
    private String address;
    private String region;
    private String dong;
    private Double latitude;
    private Double longitude;
    private String phone;
    private String mapLink;
    private BakeryStatus status;
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
    private LocalDateTime createdAt;
    private List<BakeryAiResponse.BreadInfo> breads;
    private List<BakeryAiResponse.CrowdTimeInfo> crowdTimes;

    public static BakeryAdminResponse from(
            Bakery bakery, List<Bread> breads, List<CrowdTime> crowdTimes) {
        BusinessHours bh = bakery.getBusinessHours();
        return BakeryAdminResponse.builder()
                .id(bakery.getId())
                .name(bakery.getName())
                .address(bakery.getAddress())
                .region(bakery.getRegion())
                .dong(bakery.getDong())
                .latitude(bakery.getLatitude() == 0.0 ? null : bakery.getLatitude())
                .longitude(bakery.getLongitude() == 0.0 ? null : bakery.getLongitude())
                .phone(bakery.getPhone())
                .mapLink(bakery.getMapLink())
                .status(bakery.getStatus())
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
                .weekdayOpen(bh != null ? bh.getWeekdayOpen() : null)
                .weekdayClose(bh != null ? bh.getWeekdayClose() : null)
                .weekendOpen(bh != null ? bh.getWeekendOpen() : null)
                .weekendClose(bh != null ? bh.getWeekendClose() : null)
                .lastOrderTime(bh != null ? bh.getLastOrderTime() : null)
                .holidayClosed(bh != null && bh.isHolidayClosed())
                .createdAt(bakery.getCreatedAt())
                .breads(breads.stream().map(BakeryAiResponse.BreadInfo::from).toList())
                .crowdTimes(crowdTimes.stream().map(BakeryAiResponse.CrowdTimeInfo::from).toList())
                .build();
    }
}
