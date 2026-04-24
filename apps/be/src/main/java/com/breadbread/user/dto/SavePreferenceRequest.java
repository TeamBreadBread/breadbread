package com.breadbread.user.dto;

import com.breadbread.user.entity.BakeryMood;
import com.breadbread.user.entity.BakeryUseType;
import com.breadbread.user.entity.BreadStyle;
import com.breadbread.user.entity.WaitingTolerance;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@NoArgsConstructor
public class SavePreferenceRequest {
    @Schema(description = "빵 스타일 (PLAIN: 담백한 빵, DESSERT: 달달한 디저트, PREMIUM: 고급스러운 베이커리, TRADITIONAL: 전통적인 빵, TRENDY: 요즘 핫한 메뉴)",
            example = "[\"PLAIN\", \"DESSERT\"]")
    private List<BreadStyle> breadStyles;

    @Schema(description = "빵집 성향 (FAMOUS: 유명 맛집, HIDDEN_GEM: 동네 숨은 맛집, SNS_HOT: SNS 핫플, HERITAGE: 전통 빵집)",
            example = "[\"HIDDEN_GEM\", \"HERITAGE\"]")
    private List<BakeryMood> bakeryMoods;

    @Schema(description = "선호 빵집 취향 (TAKEOUT: 포장 위주, CAFE: 카페형, SNS_MOOD: SNS 감성, PRACTICAL: 실속형)",
            example = "[\"TAKEOUT\", \"CAFE\"]")
    private List<BakeryUseType> bakeryUseTypes;

    @Schema(description = "웨이팅 허용도 (NO_WAIT: 웨이팅 싫음, UNDER_20: 10~20분 가능, UNDER_30: 30분 가능, ANYTIME: 상관없음)",
            example = "UNDER_20")
    private WaitingTolerance waitingTolerance;
}