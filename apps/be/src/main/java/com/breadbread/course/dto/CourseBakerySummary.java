package com.breadbread.course.dto;

import com.breadbread.bakery.entity.Bakery;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class CourseBakerySummary {
    private Long id;
    private String name;
    private String region;
    private Double rating;
    private String thumbnailUrl;

    public static CourseBakerySummary from(Bakery bakery, String thumbnailUrl) {
        return CourseBakerySummary.builder()
                .id(bakery.getId())
				.name(bakery.getName())
                .region(bakery.getRegion())
                .rating(bakery.getRating())
                .thumbnailUrl(thumbnailUrl)
                .build();
    }
}
