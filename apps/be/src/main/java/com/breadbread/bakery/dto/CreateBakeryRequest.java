package com.breadbread.bakery.dto;

import com.breadbread.bakery.entity.*;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.List;
import java.util.Set;

@Getter
@NoArgsConstructor
public class CreateBakeryRequest {

    @Schema(description = "빵집 이름")
    private String name;

    @Schema(description = "전체 주소")
    private String address;

    @Schema(description = "지역구 (예: 대전 중구)")
    private String region;

    private Double latitude;
    private Double longitude;
    private String phone;
    private String mapLink;
    private String note;

    private LocalTime weekdayOpen;
    private LocalTime weekdayClose;
    private LocalTime weekendOpen;
    private LocalTime weekendClose;
    private LocalTime lastOrderTime;
    private boolean holidayClosed;

    @Schema(description = "대표 빵 종류 (SALT_BREAD, DESSERT, CROISSANT, TRADITIONAL)")
    private BakeryType bakeryType;

    @Schema(description = "선호 빵집 취향 (TAKEOUT, CAFE, SNS_MOOD, PRACTICAL)")
    private List<BakeryUseType> bakeryUseTypes;

    @Schema(description = "빵집 성향 (LANDMARK, HERITAGE, HOT_PLACE, HIDDEN_GEM, SNS_HOT)")
    private List<BakeryPersonality> bakeryPersonalities;

    private Set<DayOfWeek> closedDays;
    private Set<DayOfWeek> crowdedDays;
    private boolean dineInAvailable;
    private boolean parkingAvailable;

    @Schema(description = "빵 나오는 시각")
    private LocalTime appearanceTime;

    @Schema(description = "생산 빈도 (ALWAYS, ONCE_PER_DAY, TWICE_PER_DAY)")
    private Frequency frequency;
}
