package com.breadbread.bakery.dto;

import com.breadbread.bakery.entity.Bakery;
import com.breadbread.bakery.entity.BakeryImage;
import com.breadbread.bakery.entity.BusinessHours;
import java.time.LocalTime;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import lombok.Builder;
import lombok.Getter;

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
    private List<BakeryBreadResponse> breads;
    private Long likeCount;
    private boolean liked;

    public static BakeryDetailResponse from(Bakery bakery, Long likeCount, boolean liked) {
        BusinessHours bh = bakery.getBusinessHours();

        List<BakeryBreadResponse> breads =
                bakery.getBreads() == null
                        ? Collections.emptyList()
                        : bakery.getBreads().stream().map(BakeryBreadResponse::from).toList();

        List<String> imageUrls =
                bakery.getImages() == null
                        ? Collections.emptyList()
                        : bakery.getImages().stream()
                                .sorted(Comparator.comparingInt(BakeryImage::getDisplayOrder))
                                .map(BakeryImage::getImageUrl)
                                .toList();

        return BakeryDetailResponse.builder()
                .id(bakery.getId())
                .name(bakery.getName())
                .address(bakery.getAddress())
                .lat(bakery.getLatitude())
                .lng(bakery.getLongitude())
                .phone(bakery.getPhone())
                .rating(bakery.getRating())
                .imageUrls(imageUrls)
                .openTime(bh != null ? bh.getTodayOpen() : null)
                .closeTime(bh != null ? bh.getTodayClose() : null)
                .breads(breads)
                .likeCount(likeCount)
                .liked(liked)
                .build();
    }
}
