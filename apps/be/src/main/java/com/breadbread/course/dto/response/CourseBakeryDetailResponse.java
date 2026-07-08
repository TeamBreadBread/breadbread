package com.breadbread.course.dto.response;

import com.breadbread.bakery.dto.response.BakerySummaryResponse;
import com.breadbread.bakery.entity.Bakery;
import com.breadbread.bakery.entity.BusinessHours;
import com.breadbread.course.entity.CourseBakery;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
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
    private boolean open;
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
                .open(isOpenNow(cb.getBakery()))
                .likeCount(bakery.getLikeCount())
                .reviewCount(bakery.getReviewCount())
                .liked(bakery.isLiked())
                .reason(cb.getReason())
                .recommendedBread(cb.getRecommendedBread())
                .build();
    }

    // 영업시간이 미설정/불완전이면 "닫힘"이 아니라 "모름"으로 보고 open=true 취급 (투어 시작 차단 정책과 일관)
    private static boolean isOpenNow(Bakery bakery) {
        BusinessHours hours = bakery.getBusinessHours();
        if (hours == null || !hours.isComplete()) {
            return true;
        }
        ZonedDateTime nowSeoul = ZonedDateTime.now(ZoneId.of("Asia/Seoul"));
        return hours.isOpenNow(
                nowSeoul.toLocalTime(), nowSeoul.getDayOfWeek(), bakery.getClosedDays());
    }
}
