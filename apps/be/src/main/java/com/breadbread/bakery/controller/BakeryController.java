package com.breadbread.bakery.controller;

import com.breadbread.auth.dto.CustomUserDetails;
import com.breadbread.bakery.dto.*;
import com.breadbread.bakery.service.BakeryService;
import com.breadbread.global.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Tag(name = "빵집")
@RestController
@RequestMapping("/api/bakeries")
@RequiredArgsConstructor
public class BakeryController {

    private final BakeryService bakeryService;

    @Operation(summary = "빵집 검색")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200")
    @GetMapping
    public ApiResponse<BakeryListResponse> search(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng,
            @RequestParam(required = false) Integer radius
    ) {
        return ApiResponse.ok(bakeryService.findAll());
    }

    @Operation(summary = "빵집 상세 조회")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200")
    @GetMapping("/{id}")
    public ApiResponse<BakeryDetailResponse> findOne(@PathVariable Long id) {
        return ApiResponse.ok(bakeryService.findOne(id));
    }

    @Operation(summary = "빵집 등록")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<Long> createBakery(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody CreateBakeryRequest request) {
        Long id = bakeryService.createBakery(userDetails.getId(), request);
        return ApiResponse.ok(id);
    }

    @Operation(summary = "빵집 수정")
    @PutMapping("/{id}")
    public ApiResponse<Void> updateBakery(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id,
            @RequestBody UpdateBakeryRequest request) {
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

    @Operation(summary = "메뉴 등록")
    @PostMapping("/{bakeryId}/menus")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<Long> createMenu(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long bakeryId,
            @RequestBody CreateMenuRequest request) {
        Long id = bakeryService.createMenu(userDetails.getId(), userDetails.getRole(), bakeryId, request);
        return ApiResponse.ok(id);
    }

    @Operation(summary = "메뉴 수정")
    @PutMapping("/{bakeryId}/menus/{menuId}")
    public ApiResponse<Void> updateMenu(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long bakeryId,
            @PathVariable Long menuId,
            @RequestBody UpdateMenuRequest request) {
        bakeryService.updateMenu(userDetails.getId(), userDetails.getRole(), bakeryId, menuId, request);
        return ApiResponse.ok();
    }

    @Operation(summary = "메뉴 삭제")
    @DeleteMapping("/{bakeryId}/menus/{menuId}")
    public ApiResponse<Void> deleteMenu(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long bakeryId,
            @PathVariable Long menuId) {
        bakeryService.deleteMenu(userDetails.getId(), userDetails.getRole(), bakeryId, menuId);
        return ApiResponse.ok();
    }
}
