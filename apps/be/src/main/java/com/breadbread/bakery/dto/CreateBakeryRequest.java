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
    private String lastOrderTime;
    private boolean holidayClosed;

    @Schema(description = "빵 스타일 (CLASSIC: 전통 베이커리, DESSERT: 디저트/케이크, K_DESSERT: 한식 디저트, GOURMET: 고메/프리미엄, TRENDY: 트렌디, PLAIN: 플레인/심플)", example = "CLASSIC")
    private BakeryType bakeryType;

    @Schema(description = "선호 빵집 취향 (TAKEOUT, CAFE, SNS_MOOD, PRACTICAL)")
    private List<BakeryUseType> bakeryUseTypes;

    @Schema(description = "빵집 성향 (LANDMARK, HERITAGE, HOT_PLACE, HIDDEN_GEM, SNS_HOT)")
    private List<BakeryPersonality> bakeryPersonalities;

    private Set<DayOfWeek> closedDays;
    private Set<DayOfWeek> crowdedDays;
    private boolean dineInAvailable;
    private boolean parkingAvailable;
    private boolean drinkAvailable;

    @Schema(description = "빵 나오는 시각")
    private LocalTime appearanceTime;

    @Schema(description = "생산 빈도 (ALWAYS, ONCE_PER_DAY, TWICE_PER_DAY)")
    private Frequency frequency;

    @Schema(description = "빵집 사진 URL 리스트(최대 5개 저장)")
    private String[] imageUrls;
}
