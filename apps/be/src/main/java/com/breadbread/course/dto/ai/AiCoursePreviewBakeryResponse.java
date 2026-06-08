package com.breadbread.course.dto.ai;

import com.breadbread.bakery.entity.Bakery;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AiCoursePreviewBakeryResponse {
    private Long id;
    private int order;
    private String name;
    private String recommendedBread;
    private String reason;
    private String address;
    private double latitude;
    private double longitude;
    private Double rating;

    public static AiCoursePreviewBakeryResponse of(RecommendedBakeryResponse ai, Bakery bakery) {
        return AiCoursePreviewBakeryResponse.builder()
                .id(ai.getId())
                .order(ai.getOrder())
                .name(bakery.getName())
                .recommendedBread(ai.getRecommendedBread())
                .reason(ai.getReason())
                .address(bakery.getAddress())
                .latitude(bakery.getLatitude())
                .longitude(bakery.getLongitude())
                .rating(bakery.getRating())
                .build();
    }
}
