package com.breadbread.bakery.dto;

import com.breadbread.bakery.entity.BreadType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class UpdateBreadRequest {

    @Size(min = 1)
    private String name;

    @Min(0)
    private Integer price;

    private String imageUrl;

    @Schema(description = "빵 종류 (BREAD, SANDWICH, CAKE, RICE_CAKE, COOKIE, DIET)")
    private BreadType breadType;

    private Boolean signature;
}
