package com.breadbread.bakery.dto.response;

import com.breadbread.bakery.entity.Bread;
import com.breadbread.bakery.entity.enums.BreadTagType;
import com.breadbread.bakery.entity.enums.BreadType;
import java.util.List;
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
    private List<BreadTagType> breadTags;

    public static BakeryBreadResponse from(Bread bread, List<BreadTagType> breadTags) {
        return BakeryBreadResponse.builder()
                .id(bread.getId())
                .name(bread.getName())
                .price(bread.getPrice())
                .imageUrl(bread.getImageUrl())
                .breadType(bread.getBreadType())
                .signature(bread.isSignature())
                .estimatedSoldOut(bread.isEstimatedSoldOut())
                .breadTags(breadTags)
                .build();
    }
}
