package com.breadbread.bakery.dto;

import com.breadbread.bakery.entity.BakeryPersonality;
import com.breadbread.bakery.entity.BakeryType;
import com.breadbread.bakery.entity.BakeryUseType;
import com.breadbread.bakery.entity.Frequency;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.List;
import java.util.Set;

@Getter
@NoArgsConstructor
public class UpdateBakeryRequest {

    private String name;
    private String address;
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
    private Boolean holidayClosed;

    private BakeryType bakeryType;
    private List<BakeryUseType> bakeryUseTypes;
    private List<BakeryPersonality> bakeryPersonalities;
    private Set<DayOfWeek> closedDays;
    private Set<DayOfWeek> crowdedDays;
    private Boolean dineInAvailable;
    private Boolean parkingAvailable;
    private Boolean drinkAvailable;
    private LocalTime appearanceTime;
    private Frequency frequency;
}
