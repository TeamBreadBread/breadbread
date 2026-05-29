package com.breadbread.bakery.dto;

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
}
