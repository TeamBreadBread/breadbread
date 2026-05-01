package com.breadbread.bakery.dto;

import com.breadbread.bakery.entity.Bakery;
import com.breadbread.bakery.entity.BakeryImage;
import com.breadbread.bakery.entity.BusinessHours;
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
    private Integer rating;
    private LocalTime openTime;
    private LocalTime closeTime;
    private Long likeCount;
	private boolean liked;

    public static BakerySummaryResponse from(Bakery bakery, String thumbnailUrl, Long likeCount, boolean liked) {
        BusinessHours bh = bakery.getBusinessHours();
        return BakerySummaryResponse.builder()
                .id(bakery.getId())
                .name(bakery.getName())
                .address(bakery.getAddress())
                .lat(bakery.getLatitude())
                .lng(bakery.getLongitude())
                .rating(bakery.getRating())
                .thumbnailUrl(thumbnailUrl)
                .openTime(bh != null ? bh.getTodayOpen() : null)
                .closeTime(bh != null ? bh.getTodayClose() : null)
				.likeCount(likeCount)
				.liked(liked)
                .build();
    }
}
