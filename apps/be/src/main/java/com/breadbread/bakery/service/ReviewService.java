package com.breadbread.bakery.service;

import com.breadbread.bakery.dto.CreateReviewRequest;
import com.breadbread.bakery.dto.ReviewListResponse;
import com.breadbread.bakery.dto.ReviewResponse;
import com.breadbread.bakery.dto.UpdateReviewRequest;
import com.breadbread.bakery.entity.Bakery;
import com.breadbread.bakery.entity.Review;
import com.breadbread.bakery.entity.ReviewSortType;
import com.breadbread.bakery.repository.BakeryRepository;
import com.breadbread.bakery.repository.ReviewRepository;
import com.breadbread.global.exception.CustomException;
import com.breadbread.global.exception.ErrorCode;
import com.breadbread.global.service.GcsService;
import com.breadbread.user.entity.User;
import com.breadbread.user.entity.UserRole;
import com.breadbread.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReviewService {

    private final BakeryRepository bakeryRepository;
    private final UserRepository userRepository;
    private final ReviewRepository reviewRepository;
    private final GcsService gcsService;

    @Transactional
    public Long createReview(Long bakeryId, Long userId, CreateReviewRequest request) {
        Bakery bakery =
                bakeryRepository
                        .findByIdAndActiveTrue(bakeryId)
                        .orElseThrow(() -> new CustomException(ErrorCode.BAKERY_NOT_FOUND));
        User user =
                userRepository
                        .findById(userId)
                        .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        Review review =
                Review.builder()
                        .content(request.getContent())
                        .rating(request.getRating())
                        .imageUrls(request.getImageUrls())
                        .bakery(bakery)
                        .user(user)
                        .build();
        reviewRepository.save(review);
        bakery.updateRating(reviewRepository.findAverageRatingByBakeryId(bakeryId).orElse(null));
        return review.getId();
    }

    @Transactional(readOnly = true)
    public ReviewListResponse getReviews(
            Long bakeryId, ReviewSortType sort, int page, int size, Long userId) {
        if (!bakeryRepository.existsByIdAndActiveTrue(bakeryId)) {
            throw new CustomException(ErrorCode.BAKERY_NOT_FOUND);
        }
        Sort sorting =
                switch (sort) {
                    case RATING_HIGH -> Sort.by("rating").descending();
                    case RATING_LOW -> Sort.by("rating").ascending();
                    default -> Sort.by("createdAt").descending();
                };
        Page<Review> result =
                reviewRepository.findAllByBakeryIdAndActiveTrue(
                        bakeryId, PageRequest.of(page, size, sorting));
        return ReviewListResponse.builder()
                .reviews(
                        result.getContent().stream()
                                .map(r -> ReviewResponse.from(r, userId))
                                .toList())
                .total((int) result.getTotalElements())
                .page(page)
                .size(size)
                .hasNext(result.hasNext())
                .build();
    }

    @Transactional
    public void updateReview(
            Long bakeryId, Long reviewId, Long userId, UpdateReviewRequest request) {
        Bakery bakery =
                bakeryRepository
                        .findByIdAndActiveTrue(bakeryId)
                        .orElseThrow(() -> new CustomException(ErrorCode.BAKERY_NOT_FOUND));

        Review review =
                reviewRepository
                        .findByIdAndBakeryIdAndActiveTrue(reviewId, bakeryId)
                        .orElseThrow(() -> new CustomException(ErrorCode.REVIEW_NOT_FOUND));

        if (!review.getUser().getId().equals(userId)) {
            throw new CustomException(ErrorCode.FORBIDDEN);
        }

        review.update(request);
        bakery.updateRating(reviewRepository.findAverageRatingByBakeryId(bakeryId).orElse(null));
        log.info("리뷰 수정: reviewId={}, bakeryId={}, userId={}", reviewId, bakeryId, userId);
    }

    @Transactional
    public void deleteReview(Long bakeryId, Long reviewId, Long userId, UserRole role) {
        Bakery bakery =
                bakeryRepository
                        .findByIdAndActiveTrue(bakeryId)
                        .orElseThrow(() -> new CustomException(ErrorCode.BAKERY_NOT_FOUND));

        Review review =
                reviewRepository
                        .findByIdAndBakeryIdAndActiveTrue(reviewId, bakeryId)
                        .orElseThrow(() -> new CustomException(ErrorCode.REVIEW_NOT_FOUND));

        if (role != UserRole.ROLE_ADMIN && !review.getUser().getId().equals(userId)) {
            throw new CustomException(ErrorCode.FORBIDDEN);
        }

        review.getImageUrls().forEach(gcsService::deleteQuietly);
        review.deactivate();
        bakery.updateRating(reviewRepository.findAverageRatingByBakeryId(bakeryId).orElse(null));
        log.info("리뷰 삭제: reviewId={}, bakeryId={}, userId={}", reviewId, bakeryId, userId);
    }
}
