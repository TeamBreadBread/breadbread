package com.breadbread.bakery.dto;

import com.breadbread.bakery.entity.BakeryPersonality;
import com.breadbread.bakery.entity.BakeryType;
import com.breadbread.bakery.entity.BakeryUseType;
import com.breadbread.bakery.entity.Frequency;
import com.breadbread.global.validation.NotBlankIfPresent;
import jakarta.validation.constraints.*;
import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.List;
import java.util.Set;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class UpdateBakeryRequest {

    @NotBlankIfPresent private String name;

    @NotBlankIfPresent private String address;

    @NotBlankIfPresent private String region;

    @DecimalMin("-90.0")
    @DecimalMax("90.0")
    private Double lat;

    @DecimalMin("-180.0")
    @DecimalMax("180.0")
    private Double lng;

    @NotBlankIfPresent private String phone;

    @NotBlankIfPresent private String mapLink;

    @NotBlankIfPresent
    @Size(max = 500)
    private String note;

    private LocalTime weekdayOpen;
    private LocalTime weekdayClose;
    private LocalTime weekendOpen;
    private LocalTime weekendClose;
    @NotBlankIfPresent private String lastOrderTime;
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
