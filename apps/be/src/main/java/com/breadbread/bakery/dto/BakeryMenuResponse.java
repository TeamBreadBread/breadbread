package com.breadbread.bakery.dto;

import com.breadbread.bakery.entity.BreadType;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class BakeryMenuResponse {
    private Long id;
    private String name;
    private int price;
    private String imageUrl;
    private BreadType breadType;
    private boolean signature;
    private boolean soldOut;
}
