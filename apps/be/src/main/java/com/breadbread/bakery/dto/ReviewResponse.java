package com.breadbread.bakery.dto;

import com.breadbread.bakery.entity.Review;
import java.time.LocalDateTime;
import java.util.List;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ReviewResponse {
    private Long id;
    private String authorNickname;
    private int rating;
    private String content;
    private List<String> imageUrls;
    private LocalDateTime createdAt;

    public static ReviewResponse from(Review review) {
        return ReviewResponse.builder()
                .id(review.getId())
                .authorNickname(review.getUser() != null ? review.getUser().getNickname() : null)
                .rating(review.getRating())
                .content(review.getContent())
                .imageUrls(review.getImageUrls())
                .createdAt(review.getCreatedAt())
                .build();
    }
}
