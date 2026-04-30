package com.breadbread.course.dto;

import com.breadbread.bakery.entity.Bakery;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class CourseBakerySummary {
    private String name;
    private String region;
    private Integer rating;

    public static CourseBakerySummary from(Bakery bakery) {
        return CourseBakerySummary.builder()
                .name(bakery.getName())
                .region(bakery.getRegion())
                .rating(bakery.getRating())
                .build();
    }
}
