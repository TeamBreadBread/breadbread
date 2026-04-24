package com.breadbread.bakery.dto;

import com.breadbread.bakery.entity.BreadType;
import com.breadbread.bakery.entity.Menu;
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

    public static BakeryMenuResponse from(Menu menu) {
        return BakeryMenuResponse.builder()
                .id(menu.getId())
                .name(menu.getName())
                .price(menu.getPrice())
                .imageUrl(menu.getImageUrl())
                .breadType(menu.getBreadType())
                .signature(menu.isSignature())
                .soldOut(menu.isSoldOut())
                .build();
    }
}
