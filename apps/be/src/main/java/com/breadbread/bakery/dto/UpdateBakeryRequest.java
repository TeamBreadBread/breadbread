package com.breadbread.bakery.dto;

import com.breadbread.bakery.entity.BakeryPersonality;
import com.breadbread.bakery.entity.BakeryType;
import com.breadbread.bakery.entity.BakeryUseType;
import com.breadbread.bakery.entity.Frequency;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.List;
import java.util.Set;

@Getter
@NoArgsConstructor
public class UpdateBakeryRequest {

    @Size(min = 1)
    private String name;

    @Size(min = 1)
    private String address;

    @Size(min = 1)
    private String region;

    @DecimalMin("-90.0") @DecimalMax("90.0")
    private Double latitude;

    @DecimalMin("-180.0") @DecimalMax("180.0")
    private Double longitude;

    private String phone;
    private String mapLink;

    @Size(max = 500)
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

    @Size(max = 5)
    private String[] imageUrls;
}
