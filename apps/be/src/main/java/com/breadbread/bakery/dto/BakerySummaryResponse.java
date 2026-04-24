package com.breadbread.bakery.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalTime;

@Getter
@Builder
public class BakerySummaryResponse {
    private Long id;
    private String name;
    private String address;
    private Double lat;
    private Double lng;
    private String thumbnailUrl;
    private Double rating;
    private LocalTime openTime;
    private LocalTime closeTime;
    private int likeCount;
}
