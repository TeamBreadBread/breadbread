package com.breadbread.bakery.dto.request;

import com.breadbread.bakery.entity.enums.BakeryPersonality;
import com.breadbread.bakery.entity.enums.BakeryType;
import com.breadbread.bakery.entity.enums.BakeryUseType;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
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
