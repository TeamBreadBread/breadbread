package com.breadbread.user.dto;

import com.breadbread.bakery.entity.enums.BakeryPersonality;
import com.breadbread.bakery.entity.enums.BakeryType;
import com.breadbread.bakery.entity.enums.BakeryUseType;
import com.breadbread.user.entity.WaitingTolerance;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Size;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class UpdatePreferenceRequest {
    @Schema(
            description =
                    "빵 스타일 (CLASSIC: 전통 베이커리, DESSERT: 디저트/케이크, K_DESSERT: 한식 디저트, GOURMET: 고메/프리미엄, TRENDY: 트렌디, PLAIN: 플레인/심플)",
            example = "[\"PLAIN\", \"DESSERT\"]")
    @Size(min = 1, message = "빵 스타일을 수정할 경우 최소 한 개의 항목을 포함해야 합니다.")
    private List<BakeryType> bakeryTypes;

    @Schema(
            description =
                    "빵집 성향 (LANDMARK: 유명 맛집, HIDDEN_GEM: 동네 숨은 맛집, HOT_PLACE: SNS 핫플, HERITAGE: 전통 빵집, HIP_AND_INDUSTRIAL: 힙한 인더스트리얼 무드)",
            example = "[\"HIDDEN_GEM\", \"HERITAGE\"]")
    @Size(min = 1, message = "빵집 성향을 수정할 경우 최소 한 개의 항목을 포함해야 합니다.")
    private List<BakeryPersonality> bakeryPersonalities;

    @Schema(
            description =
                    "선호 빵집 취향 (TAKEOUT: 포장 위주, CAFE_STYLE: 카페형, MOOD_SPACE: SNS 감성, PRACTICAL: 실속형)",
            example = "[\"TAKEOUT\", \"CAFE_STYLE\"]")
    @Size(min = 1, message = "선호 빵집 취향을 수정할 경우 최소 한 개의 항목을 포함해야 합니다.")
    private List<BakeryUseType> bakeryUseTypes;

    @Schema(
            description =
                    "웨이팅 허용도 (NO_WAIT: 웨이팅 싫음, UNDER_20: 10~20분 가능, UNDER_30: 30분 가능, ANYTIME: 상관없음)",
            example = "UNDER_20")
    private WaitingTolerance waitingTolerance;
}
