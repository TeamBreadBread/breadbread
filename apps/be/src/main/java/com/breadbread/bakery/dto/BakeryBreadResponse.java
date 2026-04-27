package com.breadbread.bakery.dto;

import com.breadbread.bakery.entity.BreadType;
import com.breadbread.bakery.entity.Bread;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class BakeryBreadResponse {
    private Long id;
    private String name;
    private int price;
    private String imageUrl;
    private BreadType breadType;
    private boolean signature;
    private boolean estimatedSoldOut;

    public static BakeryBreadResponse from(Bread bread) {
        return BakeryBreadResponse.builder()
                .id(bread.getId())
                .name(bread.getName())
                .price(bread.getPrice())
                .imageUrl(bread.getImageUrl())
                .breadType(bread.getBreadType())
                .signature(bread.isSignature())
                .estimatedSoldOut(bread.isEstimatedSoldOut())
                .build();
    }
}
