package com.breadbread.tour.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class CongestionInstantCheckRequest {

    @NotNull private Long courseId;

    @NotEmpty private List<Long> bakeryIds;

    private Long targetBakeryId; // 특정 빵집만 체크할 때. null이면 bakeryIds 전체 분석
}
