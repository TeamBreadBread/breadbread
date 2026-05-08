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
public class BakerySummaryResponse {
    private Long id;
    private String name;
    private String address;
    private Double lat;
    private Double lng;
    private String thumbnailUrl;

    /** 정렬된 매장 이미지 중 최대 4장 (리스트 미리보기) */
    private List<String> previewImageUrls;

    /** `previewImageUrls`에 담기지 않은 나머지 이미지 수 (4장 초과분) */
    private int remainingPreviewImageCount;

    private Double rating;
    private LocalTime openTime;
    private LocalTime closeTime;
    private Long likeCount;
    private boolean liked;

    public static BakerySummaryResponse from(
            Bakery bakery, String thumbnailUrl, Long likeCount, boolean liked) {
        return from(bakery, thumbnailUrl, likeCount, liked, Collections.emptyList(), 0);
    }

    public static BakerySummaryResponse from(
            Bakery bakery,
            String thumbnailUrl,
            Long likeCount,
            boolean liked,
            List<String> previewImageUrls,
            int remainingPreviewImageCount) {
        BusinessHours bh = bakery.getBusinessHours();
        return BakerySummaryResponse.builder()
                .id(bakery.getId())
                .name(bakery.getName())
                .address(bakery.getAddress())
                .lat(bakery.getLatitude())
                .lng(bakery.getLongitude())
                .rating(bakery.getRating())
                .thumbnailUrl(thumbnailUrl)
                .previewImageUrls(
                        previewImageUrls == null ? List.of() : List.copyOf(previewImageUrls))
                .remainingPreviewImageCount(Math.max(0, remainingPreviewImageCount))
                .openTime(bh != null ? bh.getTodayOpen() : null)
                .closeTime(bh != null ? bh.getTodayClose() : null)
                .likeCount(likeCount)
                .liked(liked)
                .build();
    }
}
