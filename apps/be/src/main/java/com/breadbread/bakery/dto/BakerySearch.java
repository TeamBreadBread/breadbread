package com.breadbread.bakery.dto;

import com.breadbread.bakery.entity.BakerySortType;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
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
public class BakerySearch {
    private String keyword;
    private BakerySortType sort;
    private boolean open;
    private String region;
    private String dong;

    @DecimalMin(value = "-90.0", message = "위도는 -90 이상이어야 합니다.")
    @DecimalMax(value = "90.0", message = "위도는 90 이하이어야 합니다.")
    private Double userLat;

    @DecimalMin(value = "-180.0", message = "경도는 -180 이상이어야 합니다.")
    @DecimalMax(value = "180.0", message = "경도는 180 이하이어야 합니다.")
    private Double userLng;

    @Min(value = 1, message = "검색 반경은 1미터 이상이어야 합니다.")
    private Integer radiusMeters;
}
