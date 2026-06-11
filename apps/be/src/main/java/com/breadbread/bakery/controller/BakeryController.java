package com.breadbread.bakery.controller;

import com.breadbread.auth.dto.CustomUserDetails;
import com.breadbread.bakery.dto.*;
import com.breadbread.bakery.entity.ReviewSortType;
import com.breadbread.bakery.service.BakeryService;
import com.breadbread.bakery.service.BreadService;
import com.breadbread.bakery.service.GooglePlacesUpdateService;
import com.breadbread.bakery.service.ReviewService;
import com.breadbread.global.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.Parameters;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Tag(name = "빵집")
@RestController
@RequestMapping("/bakeries")
@RequiredArgsConstructor
public class BakeryController {

    private final BakeryService bakeryService;
    private final BreadService breadService;
    private final ReviewService reviewService;
    private final GooglePlacesUpdateService googlePlacesUpdateService;

    @Operation(
            summary = "AI용 빵집 목록 조회",
            description = "키워드, 지역구, 영업중, 음료판매, 매장취식, 빵집유형, 이용유형, 분위기 필터 지원")
    @Parameters({
        @Parameter(name = "keyword", description = "빵집 이름 검색어"),
        @Parameter(
                name = "open",
                description =
                        "true 시 지정한 날짜·시각 기준 영업 중인 빵집만 반환, 혼잡도도 해당 요일(평일/주말)만 포함. false 시 혼잡도 전체 반환 (기본값: false)"),
        @Parameter(name = "visitDate", description = "영업중 판단 기준 날짜 (미입력 시 오늘, 형식: yyyy-MM-dd)"),
        @Parameter(name = "visitTime", description = "영업중 판단 기준 시각 (미입력 시 현재 시각, 형식: HH:mm)"),
        @Parameter(name = "region", description = "지    역구 필터", example = "대전 중구"),
        @Parameter(name = "drinkAvailable", description = "음료 판매 여부 필터"),
        @Parameter(name = "dineInAvailable", description = "매장 취식 여부 필터"),
        @Parameter(name = "bakeryType", description = "빵집 유형 필터"),
        @Parameter(name = "bakeryUseTypes", description = "이용 유형 필터 (복수 선택 가능, OR 조건)"),
        @Parameter(name = "bakeryPersonalities", description = "분위기 필터 (복수 선택 가능, OR 조건)")
    })
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200")
    @GetMapping("/ai")
    public ApiResponse<List<BakeryAiResponse>> findAllForAi(@ModelAttribute BakeryAiSearch search) {
        return ApiResponse.ok(bakeryService.findAllForAi(search));
    }

    @Operation(summary = "빵집 목록 조회", description = "키워드 검색, 지역 필터, 정렬, 영업 중 우선 배치, 페이징 지원")
    @Parameters({
        @Parameter(name = "keyword", description = "빵집 이름 검색어", example = "성심당"),
        @Parameter(
                name = "sort",
                description =
                        "정렬 기준 (RATING: 별점순 / REVIEW_COUNT: 리뷰순 / LIKE_COUNT: 하트순 / NEARBY: 가까운순)"),
        @Parameter(name = "open", description = "true 시 영업 중인 빵집을 상단에 우선 배치 (기본값: false)"),
        @Parameter(name = "region", description = "지역구 필터", example = "대전 중구"),
        @Parameter(name = "dong", description = "행정동 필터", example = "은행동"),
        @Parameter(
                name = "userLat",
                description = "사용자 위도 (sort=NEARBY 또는 radiusMeters 사용 시 필수)",
                example = "36.3504"),
        @Parameter(
                name = "userLng",
                description = "사용자 경도 (sort=NEARBY 또는 radiusMeters 사용 시 필수)",
                example = "127.3845"),
        @Parameter(
                name = "radiusMeters",
                description = "검색 반경 (미터 단위, userLat·userLng 필요)",
                example = "3000"),
        @Parameter(name = "page", description = "페이지 번호 (0부터 시작, 기본값: 0)"),
        @Parameter(name = "size", description = "페이지 크기 (기본값: 10)")
    })
    @GetMapping
    public ApiResponse<BakeryListResponse> search(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @ModelAttribute BakerySearch search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Long userId = userDetails != null ? userDetails.getId() : null;
        return ApiResponse.ok(bakeryService.search(search, PageRequest.of(page, size), userId));
    }

    @Operation(summary = "빵집 목록 간략 조회", description = "id·이름·주소·별점·썸네일만 반환. 필터·정렬은 목록 조회와 동일하게 지원")
    @Parameters({
        @Parameter(name = "keyword", description = "빵집 이름 검색어", example = "성심당"),
        @Parameter(
                name = "sort",
                description =
                        "정렬 기준 (RATING: 별점순 / REVIEW_COUNT: 리뷰순 / LIKE_COUNT: 하트순 / NEARBY: 가까운순)"),
        @Parameter(name = "open", description = "true 시 영업 중인 빵집을 상단에 우선 배치 (기본값: false)"),
        @Parameter(name = "region", description = "지역구 필터", example = "대전 중구"),
        @Parameter(name = "dong", description = "행정동 필터", example = "은행동"),
        @Parameter(
                name = "userLat",
                description = "사용자 위도 (sort=NEARBY 또는 radiusMeters 사용 시 필수)",
                example = "36.3504"),
        @Parameter(
                name = "userLng",
                description = "사용자 경도 (sort=NEARBY 또는 radiusMeters 사용 시 필수)",
                example = "127.3845"),
        @Parameter(
                name = "radiusMeters",
                description = "검색 반경 (미터 단위, userLat·userLng 필요)",
                example = "3000"),
        @Parameter(name = "page", description = "페이지 번호 (0부터 시작, 기본값: 0)"),
        @Parameter(name = "size", description = "페이지 크기 (기본값: 10)")
    })
    @GetMapping("/summary")
    public ApiResponse<BakerySimpleListResponse> searchSimple(
            @Valid @ModelAttribute BakerySearch search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ApiResponse.ok(bakeryService.searchSimple(search, PageRequest.of(page, size)));
    }

    @Operation(summary = "AI용 빵집 상세 조회", description = "평일/주말 혼잡도·영업시간 전체 반환, null 필드 제외")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200")
    @GetMapping("/ai/{id}")
    public ApiResponse<BakeryAiResponse> findOneForAi(@PathVariable Long id) {
        return ApiResponse.ok(bakeryService.findOneForAi(id));
    }

    @Operation(summary = "빵집 상세 조회")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200")
    @GetMapping("/{id}")
    public ApiResponse<BakeryDetailResponse> findOne(
            @AuthenticationPrincipal CustomUserDetails userDetails, @PathVariable Long id) {
        Long userId = userDetails != null ? userDetails.getId() : null;
        return ApiResponse.ok(bakeryService.findOne(id, userId));
    }

    @Operation(summary = "빵집 등록", description = "관리자 또는 빵집 사장님만 가능")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<Long> createBakery(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody CreateBakeryRequest request) {
        Long id = bakeryService.createBakery(userDetails.getId(), request);
        return ApiResponse.ok(id);
    }

    @Operation(summary = "빵집 수정", description = "관리자 또는 빵집 사장님만 가능")
    @PatchMapping("/{id}")
    public ApiResponse<Void> updateBakery(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id,
            @Valid @RequestBody UpdateBakeryRequest request) {
        bakeryService.updateBakery(userDetails.getId(), userDetails.getRole(), id, request);
        return ApiResponse.ok();
    }

    @Operation(summary = "빵집 삭제", description = "관리자 또는 빵집 사장님만 가능")
    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteBakery(
            @AuthenticationPrincipal CustomUserDetails userDetails, @PathVariable Long id) {
        bakeryService.deleteBakery(userDetails.getId(), userDetails.getRole(), id);
        return ApiResponse.ok();
    }

    @Operation(summary = "빵집 메뉴 등록", description = "관리자 또는 빵집 사장님만 가능")
    @PostMapping("/{bakeryId}/breads")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<Long> createBread(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long bakeryId,
            @Valid @RequestBody CreateBreadRequest request) {
        Long id =
                breadService.createBread(
                        userDetails.getId(), userDetails.getRole(), bakeryId, request);
        return ApiResponse.ok(id);
    }

    @Operation(summary = "빵집 메뉴 수정", description = "관리자 또는 빵집 사장님만 가능")
    @PatchMapping("/{bakeryId}/breads/{breadId}")
    public ApiResponse<Void> updateBread(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long bakeryId,
            @PathVariable Long breadId,
            @Valid @RequestBody UpdateBreadRequest request) {
        breadService.updateBread(
                userDetails.getId(), userDetails.getRole(), bakeryId, breadId, request);
        return ApiResponse.ok();
    }

    @Operation(summary = "빵집 메뉴 삭제", description = "관리자 또는 빵집 사장님만 가능")
    @DeleteMapping("/{bakeryId}/breads/{breadId}")
    public ApiResponse<Void> deleteBread(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long bakeryId,
            @PathVariable Long breadId) {
        breadService.deleteBread(userDetails.getId(), userDetails.getRole(), bakeryId, breadId);
        return ApiResponse.ok();
    }

    @Operation(summary = "빵집 좋아요", description = "이미 좋아요한 경우 409 반환")
    @PostMapping("/{id}/likes")
    public ApiResponse<Void> like(
            @AuthenticationPrincipal CustomUserDetails userDetails, @PathVariable Long id) {
        bakeryService.like(id, userDetails.getId());
        return ApiResponse.ok();
    }

    @Operation(summary = "빵집 좋아요 취소", description = "좋아요하지 않은 경우 400 반환")
    @DeleteMapping("/{id}/likes")
    public ApiResponse<Void> unlike(
            @AuthenticationPrincipal CustomUserDetails userDetails, @PathVariable Long id) {
        bakeryService.unlike(id, userDetails.getId());
        return ApiResponse.ok();
    }

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

    @Operation(
            summary = "빵집 구글 Places 동기화 (관리자 전용)",
            description = "구글 Places API로 dong 및 이미지(placePhotoName)를 업데이트한다.")
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/{id}/sync-places")
    public ApiResponse<Void> syncPlaces(@PathVariable Long id) {
        googlePlacesUpdateService.syncBakery(id);
        return ApiResponse.ok();
    }

    @Operation(
            summary = "전체 빵집 구글 Places 동기화 (관리자 전용)",
            description = "활성 상태인 모든 빵집을 구글 Places API와 동기화한다. 개별 실패는 무시하고 계속 진행한다.")
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/sync-places")
    public ApiResponse<Void> syncAllPlaces() {
        googlePlacesUpdateService.syncAllBakeries();
        return ApiResponse.ok();
    }
}
