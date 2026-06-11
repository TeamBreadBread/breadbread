package com.breadbread.bakery.dto.response;

import com.breadbread.bakery.entity.Review;
import java.time.LocalDateTime;
import java.util.List;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class MyReviewResponse {
    private Long reviewId;
    private Long bakeryId;
    private String bakeryName;
    private int rating;
    private String content;
    private List<String> imageUrls;
    private LocalDateTime createdAt;

    public static MyReviewResponse from(Review review) {
        return MyReviewResponse.builder()
                .reviewId(review.getId())
                .bakeryId(review.getBakery().getId())
                .bakeryName(review.getBakery().getName())
                .rating(review.getRating())
                .content(review.getContent())
                .imageUrls(review.getImageUrls())
                .createdAt(review.getCreatedAt())
                .build();
    }
}
