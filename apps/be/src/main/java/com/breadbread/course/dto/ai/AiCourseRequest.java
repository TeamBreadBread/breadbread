package com.breadbread.course.dto.ai;

import com.breadbread.bakery.entity.BreadType;
import com.breadbread.course.entity.BudgetRange;
import com.breadbread.course.entity.FlexibilityLevel;
import com.breadbread.course.entity.TravelType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@NoArgsConstructor
@Schema(description = "AI 코스 추천 요청")
public class AiCourseRequest {

    @NotNull
    @Schema(description = "여행 유형 (ALONE: 혼자, COUPLE: 커플, FRIENDS: 친구, FAMILY: 가족)", example = "COUPLE")
    private TravelType travelType;

    @NotNull
    @Schema(description = "예산 (UNDER_20000: 2만원 이하, BETWEEN_20000_40000: 2~4만원, OVER_40000: 4만원 이상, ANY: 상관없음)", example = "BETWEEN_20000_40000")
    private BudgetRange budgetRange;

    @Schema(description = "동선 최소화 여부", example = "true")
    private boolean minimizeRoute;

	@NotEmpty
    @Schema(description = "선호 빵 종류 (BREAD, SANDWICH, CAKE, RICE_CAKE, COOKIE, DIET)", example = "[\"BREAD\", \"CAKE\"]")
    private List<BreadType> breadTypes;

    @DecimalMin(value = "-90.0") @DecimalMax(value = "90.0")
    @Schema(description = "현재 위치 위도", example = "36.3504")
    private double latitude;

    @DecimalMin(value = "-180.0") @DecimalMax(value = "180.0")
    @Schema(description = "현재 위치 경도", example = "127.3845")
    private double longitude;

    @Schema(description = "웨이팅 선호", example = "false")
    private boolean waitingPreference;

    @Schema(description = "음료 파는 곳 선호 ", example = "true")
    private boolean drinkPreference;

    @Min(1) @Max(10)
    @Schema(description = "추천 빵집 수", example = "3")
    private int bakeryCount;

    @NotNull
    @Schema(description = "코스 유연성 (MAINTAIN: 계획 유지, ACTIVE: 적극 변경, SOLDOUT_ONLY: 품절 시만 변경)", example = "SOLDOUT_ONLY")
    private FlexibilityLevel flexibilityLevel;
}
