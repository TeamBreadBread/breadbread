package com.breadbread.bakery.dto;

import com.breadbread.bakery.entity.BreadType;
import com.breadbread.global.validation.NotBlankIfPresent;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class UpdateBreadRequest {

    @NotBlankIfPresent private String name;

    @Min(0)
    private Integer price;

    @NotBlankIfPresent private String imageUrl;

    @Schema(description = "빵 종류 (BREAD, SANDWICH, CAKE, RICE_CAKE, COOKIE, DIET)")
    private BreadType breadType;

    private Boolean signature;
}
