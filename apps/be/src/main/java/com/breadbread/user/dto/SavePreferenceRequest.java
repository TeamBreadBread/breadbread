package com.breadbread.user.dto;

import com.breadbread.bakery.entity.BakeryPersonality;
import com.breadbread.bakery.entity.BakeryType;
import com.breadbread.bakery.entity.BakeryUseType;
import com.breadbread.user.entity.WaitingTolerance;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@NoArgsConstructor
public class SavePreferenceRequest {
    @Schema(description = "빵 스타일 (CLASSIC: 전통 베이커리, DESSERT: 디저트/케이크, K_DESSERT: 한식 디저트, GOURMET: 고메/프리미엄, TRENDY: 트렌디, PLAIN: 플레인/심플)",
            example = "[\"PLAIN\", \"DESSERT\"]")
    private List<BakeryType> bakeryTypes;

    @Schema(description = "빵집 성향 (FAMOUS: 유명 맛집, HIDDEN_GEM: 동네 숨은 맛집, SNS_HOT: SNS 핫플, HERITAGE: 전통 빵집)",
            example = "[\"HIDDEN_GEM\", \"HERITAGE\"]")
    private List<BakeryPersonality> bakeryPersonalities;

    @Schema(description = "선호 빵집 취향 (TAKEOUT: 포장 위주, CAFE_STYLE: 카페형, MOOD_SPACE: SNS 감성, PRACTICAL: 실속형)",
            example = "[\"TAKEOUT\", \"CAFE\"]")
    private List<BakeryUseType> bakeryUseTypes;

    @Schema(description = "웨이팅 허용도 (NO_WAIT: 웨이팅 싫음, UNDER_20: 10~20분 가능, UNDER_30: 30분 가능, ANYTIME: 상관없음)",
            example = "UNDER_20")
    private WaitingTolerance waitingTolerance;
}