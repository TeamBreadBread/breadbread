package com.breadbread.bakery.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalTime;
import java.util.List;

@Getter
@Builder
public class BakeryDetailResponse {
    private Long id;
    private String name;
    private String address;
    private Double lat;
    private Double lng;
    private List<String> imageUrls;
    private LocalTime openTime;
    private LocalTime closeTime;
    private String phone;
    private Double rating;
    private List<BakeryMenuResponse> menus;
}
