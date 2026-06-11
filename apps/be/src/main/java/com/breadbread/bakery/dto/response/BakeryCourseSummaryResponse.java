package com.breadbread.bakery.dto.response;

import com.breadbread.bakery.entity.Bakery;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class BakeryCourseSummaryResponse {
    private Long id;
    private String name;
    private String region;
    private Double rating;
    private String thumbnailUrl;
    private boolean active;

    public static BakeryCourseSummaryResponse from(Bakery bakery, String thumbnailUrl) {
        return BakeryCourseSummaryResponse.builder()
                .id(bakery.getId())
                .name(bakery.getName())
                .region(bakery.getRegion())
                .rating(bakery.getRating())
                .thumbnailUrl(thumbnailUrl)
                .active(bakery.isActive())
                .build();
    }
}
