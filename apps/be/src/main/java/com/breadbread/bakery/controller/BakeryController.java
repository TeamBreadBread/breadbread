package com.breadbread.bakery.controller;

import com.breadbread.auth.dto.CustomUserDetails;
import com.breadbread.bakery.dto.*;
import com.breadbread.bakery.entity.BakerySortType;
import com.breadbread.bakery.service.BakeryService;
import com.breadbread.global.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.Parameters;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Tag(name = "빵집")
@RestController
@RequestMapping("/api/bakeries")
@RequiredArgsConstructor
public class BakeryController {

    private final BakeryService bakeryService;

    @Operation(summary = "AI용 빵집 전체 조회")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200")
    @GetMapping("/ai")
    public ApiResponse<java.util.List<BakeryAiResponse>> findAllForAi() {
        return ApiResponse.ok(bakeryService.findAllForAi());
    }

    @Operation(
            summary = "빵집 목록 조회",
            description = "키워드 검색, 지역 필터, 정렬, 영업 중 우선 배치, 페이징 지원"
    )
    @Parameters({
            @Parameter(name = "keyword", description = "빵집 이름 검색어", example = "성심당"),
            @Parameter(name = "sort", description = "정렬 기준 (RATING: 별점순 / REVIEW_COUNT: 리뷰순 / LIKE_COUNT: 하트순)"),
            @Parameter(name = "open", description = "true 시 영업 중인 빵집을 상단에 우선 배치 (기본값: false)"),
            @Parameter(name = "region", description = "지역구 필터", example = "대전 중구"),
            @Parameter(name = "page", description = "페이지 번호 (0부터 시작, 기본값: 0)"),
            @Parameter(name = "size", description = "페이지 크기 (기본값: 10)")
    })
    @GetMapping
    public ApiResponse<BakeryListResponse> search(
			@AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) BakerySortType sort,
            @RequestParam(defaultValue = "false") boolean open,
            @RequestParam(required = false) String region,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
		Long userId = userDetails != null ? userDetails.getId() : null;
        BakerySearch search = BakerySearch.builder()
                .keyword(keyword)
                .sort(sort)
                .open(open)
                .region(region)
                .build();
        return ApiResponse.ok(bakeryService.search(search, PageRequest.of(page, size), userId));
    }

    @Operation(summary = "빵집 상세 조회")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200")
    @GetMapping("/{id}")
    public ApiResponse<BakeryDetailResponse> findOne(
		@AuthenticationPrincipal CustomUserDetails userDetails,
		@PathVariable Long id) {
		Long userId = userDetails != null ? userDetails.getId() : null;
        return ApiResponse.ok(bakeryService.findOne(id, userId));
    }

    @Operation(summary = "빵집 등록")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<Long> createBakery(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody CreateBakeryRequest request) {
        Long id = bakeryService.createBakery(userDetails.getId(), request);
        return ApiResponse.ok(id);
    }

    @Operation(summary = "빵집 수정")
    @PatchMapping("/{id}")
    public ApiResponse<Void> updateBakery(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id,
            @Valid @RequestBody UpdateBakeryRequest request) {
        bakeryService.updateBakery(userDetails.getId(), userDetails.getRole(), id, request);
        return ApiResponse.ok();
    }

    @Operation(summary = "빵집 삭제")
    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteBakery(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id) {
        bakeryService.deleteBakery(userDetails.getId(), userDetails.getRole(), id);
        return ApiResponse.ok();
    }

    @Operation(summary = "빵집 메뉴 등록")
    @PostMapping("/{bakeryId}/breads")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<Long> createBread(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long bakeryId,
            @Valid @RequestBody CreateBreadRequest request) {
        Long id = bakeryService.createBread(userDetails.getId(), userDetails.getRole(), bakeryId, request);
        return ApiResponse.ok(id);
    }

    @Operation(summary = "빵집 메뉴 수정")
    @PatchMapping("/{bakeryId}/breads/{breadId}")
    public ApiResponse<Void> updateBread(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long bakeryId,
            @PathVariable Long breadId,
            @Valid @RequestBody UpdateBreadRequest request) {
        bakeryService.updateBread(userDetails.getId(), userDetails.getRole(), bakeryId, breadId, request);
        return ApiResponse.ok();
    }

    @Operation(summary = "빵집 메뉴 삭제")
    @DeleteMapping("/{bakeryId}/breads/{breadId}")
    public ApiResponse<Void> deleteBread(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long bakeryId,
            @PathVariable Long breadId) {
        bakeryService.deleteBread(userDetails.getId(), userDetails.getRole(), bakeryId, breadId);
        return ApiResponse.ok();
    }

    @Operation(summary = "빵집 좋아요", description = "이미 좋아요한 경우 409 반환")
    @PostMapping("/{id}/likes")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<Void> like(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id) {
        bakeryService.like(id, userDetails.getId());
        return ApiResponse.ok();
    }

    @Operation(summary = "빵집 좋아요 취소", description = "좋아요하지 않은 경우 400 반환")
    @DeleteMapping("/{id}/likes")
    public ApiResponse<Void> unlike(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id) {
        bakeryService.unlike(id, userDetails.getId());
        return ApiResponse.ok();
    }
}
