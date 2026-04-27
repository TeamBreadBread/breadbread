package com.breadbread.bakery.dto;

import com.breadbread.bakery.entity.BreadType;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class CreateBreadRequest {

    private String name;
    private int price;
    private String imageUrl;

    @Schema(description = "빵 종류 (BREAD, SANDWICH, CAKE, RICE_CAKE, COOKIE, DIET)")
    private BreadType breadType;

    private boolean signature;
}
