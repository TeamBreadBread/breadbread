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

    @Schema(description = "빵 종류 (SALT_BREAD, DESSERT, CROISSANT, TRADITIONAL)")
    private BreadType breadType;

    private boolean signature;
}
