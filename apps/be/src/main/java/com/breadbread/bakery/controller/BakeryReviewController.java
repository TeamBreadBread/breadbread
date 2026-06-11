package com.breadbread.bakery.controller;

import com.breadbread.auth.dto.CustomUserDetails;
import com.breadbread.bakery.dto.request.CreateReviewRequest;
import com.breadbread.bakery.dto.request.UpdateReviewRequest;
import com.breadbread.bakery.dto.response.ReviewListResponse;
import com.breadbread.bakery.entity.enums.ReviewSortType;
import com.breadbread.bakery.service.ReviewService;
import com.breadbread.global.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.Parameters;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Tag(name = "빵집 - 리뷰")
@RestController
@RequestMapping("/bakeries")
@RequiredArgsConstructor
public class BakeryReviewController {

    private final ReviewService reviewService;

    @Operation(summary = "빵집 리뷰 목록 조회")
    @Parameters({
        @Parameter(
                name = "sort",
                description =
                        "정렬 기준 (LATEST: 최신순 / RATING_HIGH: 별점 높은순 / RATING_LOW: 별점 낮은순, 기본값: LATEST)"),
        @Parameter(name = "page", description = "페이지 번호 (0부터 시작, 기본값: 0)"),
        @Parameter(name = "size", description = "페이지 크기 (기본값: 10)")
    })
    @GetMapping("/{bakeryId}/reviews")
    public ApiResponse<ReviewListResponse> getReviews(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long bakeryId,
            @RequestParam(defaultValue = "LATEST") ReviewSortType sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Long userId = userDetails != null ? userDetails.getId() : null;
        return ApiResponse.ok(reviewService.getReviews(bakeryId, sort, page, size, userId));
    }

    @Operation(summary = "빵집 리뷰 등록")
    @PostMapping("/{bakeryId}/reviews")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<Long> createReview(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long bakeryId,
            @Valid @RequestBody CreateReviewRequest request) {
        return ApiResponse.ok(reviewService.createReview(bakeryId, userDetails.getId(), request));
    }

    @Operation(summary = "빵집 리뷰 수정", description = "본인 작성 리뷰만 수정 가능")
    @PatchMapping("/{bakeryId}/reviews/{reviewId}")
    public ApiResponse<Void> updateReview(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long bakeryId,
            @PathVariable Long reviewId,
            @Valid @RequestBody UpdateReviewRequest request) {
        reviewService.updateReview(bakeryId, reviewId, userDetails.getId(), request);
        return ApiResponse.ok();
    }

    @Operation(summary = "빵집 리뷰 삭제", description = "본인 작성 리뷰 또는 관리자만 삭제 가능")
    @DeleteMapping("/{bakeryId}/reviews/{reviewId}")
    public ApiResponse<Void> deleteReview(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long bakeryId,
            @PathVariable Long reviewId) {
        reviewService.deleteReview(bakeryId, reviewId, userDetails.getId(), userDetails.getRole());
        return ApiResponse.ok();
    }
}
