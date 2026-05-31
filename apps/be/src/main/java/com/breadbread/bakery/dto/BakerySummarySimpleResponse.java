package com.breadbread.bakery.dto;

import com.breadbread.bakery.entity.Bakery;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class BakerySummarySimpleResponse {
    private Long id;
    private String name;
    private String address;
    private Double rating;
    private String thumbnailUrl;

    public static BakerySummarySimpleResponse from(Bakery bakery, String thumbnailUrl) {
        return BakerySummarySimpleResponse.builder()
                .id(bakery.getId())
                .name(bakery.getName())
                .address(bakery.getAddress())
                .rating(bakery.getRating())
                .thumbnailUrl(thumbnailUrl)
                .build();
    }
}
