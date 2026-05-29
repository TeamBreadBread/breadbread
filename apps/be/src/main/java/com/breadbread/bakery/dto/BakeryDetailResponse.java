package com.breadbread.bakery.dto;

import com.breadbread.bakery.entity.Bakery;
import com.breadbread.bakery.entity.BusinessHours;
import java.time.LocalTime;
import java.util.Collections;
import java.util.List;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class BakeryDetailResponse {
    private Long id;
    private String name;
    private String address;
    private String dong;
    private Double lat;
    private Double lng;
    private List<String> imageUrls;
    private LocalTime openTime;
    private LocalTime closeTime;
    private String phone;
    private Double rating;
    private List<BakeryBreadResponse> breads;
    private Long likeCount;
    private boolean liked;

    public static BakeryDetailResponse from(
            Bakery bakery, Long likeCount, boolean liked, List<String> resolvedImageUrls) {
        BusinessHours bh = bakery.getBusinessHours();

        List<BakeryBreadResponse> breads =
                bakery.getBreads() == null
                        ? Collections.emptyList()
                        : bakery.getBreads().stream().map(BakeryBreadResponse::from).toList();

        return BakeryDetailResponse.builder()
                .id(bakery.getId())
                .name(bakery.getName())
                .address(bakery.getAddress())
                .dong(bakery.getDong())
                .lat(bakery.getLatitude())
                .lng(bakery.getLongitude())
                .phone(bakery.getPhone())
                .rating(bakery.getRating())
                .imageUrls(resolvedImageUrls)
                .openTime(bh != null ? bh.getTodayOpen() : null)
                .closeTime(bh != null ? bh.getTodayClose() : null)
                .breads(breads)
                .likeCount(likeCount)
                .liked(liked)
                .build();
    }
}
