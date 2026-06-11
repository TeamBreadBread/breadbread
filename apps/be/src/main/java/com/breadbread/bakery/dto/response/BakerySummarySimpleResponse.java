package com.breadbread.bakery.dto.response;

import com.breadbread.bakery.entity.Bakery;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class BakerySummarySimpleResponse {
    private Long id;
    private String name;
    private String address;
    private String dong;
    private Double rating;
    private String thumbnailUrl;

    public static BakerySummarySimpleResponse from(
            Bakery bakery, String thumbnailUrl, Double rating) {
        return BakerySummarySimpleResponse.builder()
                .id(bakery.getId())
                .name(bakery.getName())
                .address(bakery.getAddress())
                .dong(bakery.getDong())
                .rating(rating != null ? rating : 0.0)
                .thumbnailUrl(thumbnailUrl)
                .build();
    }
}
