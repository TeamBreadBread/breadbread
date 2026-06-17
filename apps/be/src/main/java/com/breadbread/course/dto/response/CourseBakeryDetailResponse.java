package com.breadbread.course.dto.response;

import com.breadbread.bakery.dto.response.BakerySummaryResponse;
import com.breadbread.course.entity.CourseBakery;
import java.time.LocalTime;
import java.util.List;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class CourseBakeryDetailResponse {
    private Long id;
    private String name;
    private String address;
    private String dong;
    private Double lat;
    private Double lng;
    private String thumbnailUrl;
    private List<String> previewImageUrls;
    private int remainingPreviewImageCount;
    private Double rating;
    private LocalTime openTime;
    private LocalTime closeTime;
    private Long likeCount;
    private Long reviewCount;
    private boolean liked;
    private String reason;
    private String recommendedBread;

    public static CourseBakeryDetailResponse of(CourseBakery cb, BakerySummaryResponse bakery) {
        return CourseBakeryDetailResponse.builder()
                .id(bakery.getId())
                .name(bakery.getName())
                .address(bakery.getAddress())
                .dong(bakery.getDong())
                .lat(bakery.getLat())
                .lng(bakery.getLng())
                .thumbnailUrl(bakery.getThumbnailUrl())
                .previewImageUrls(bakery.getPreviewImageUrls())
                .remainingPreviewImageCount(bakery.getRemainingPreviewImageCount())
                .rating(bakery.getRating())
                .openTime(bakery.getOpenTime())
                .closeTime(bakery.getCloseTime())
                .likeCount(bakery.getLikeCount())
                .reviewCount(bakery.getReviewCount())
                .liked(bakery.isLiked())
                .reason(cb.getReason())
                .recommendedBread(cb.getRecommendedBread())
                .build();
    }
}
