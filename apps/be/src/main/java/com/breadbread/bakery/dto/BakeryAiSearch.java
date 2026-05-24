package com.breadbread.bakery.dto;

import com.breadbread.bakery.entity.BakeryPersonality;
import com.breadbread.bakery.entity.BakeryType;
import com.breadbread.bakery.entity.BakeryUseType;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class BakeryAiSearch {
    private String keyword;
    private boolean open;
    private LocalDate visitDate;
    private LocalTime visitTime;
    private String region;
    private Boolean drinkAvailable;
    private Boolean dineInAvailable;
    private BakeryType bakeryType;
    private List<BakeryUseType> bakeryUseTypes;
    private List<BakeryPersonality> bakeryPersonalities;
}
