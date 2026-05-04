package com.breadbread.user.dto;

import com.breadbread.bakery.entity.BakeryPersonality;
import com.breadbread.bakery.entity.BakeryType;
import com.breadbread.bakery.entity.BakeryUseType;
import com.breadbread.user.entity.UserPreference;
import com.breadbread.user.entity.WaitingTolerance;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class PreferenceResponse {
    private List<BakeryType> bakeryTypes;
    private List<BakeryPersonality> bakeryPersonalities;
    private List<BakeryUseType> bakeryUseTypes;
    private WaitingTolerance waitingTolerance;

    public static PreferenceResponse from(UserPreference preference) {
        return PreferenceResponse.builder()
                .bakeryTypes(preference.getBakeryTypes())
                .bakeryPersonalities(preference.getBakeryMoods())
                .bakeryUseTypes(preference.getBakeryUseTypes())
                .waitingTolerance(preference.getWaitingTolerance())
                .build();
    }
}
