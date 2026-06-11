package com.breadbread.bakery.controller;

import com.breadbread.auth.dto.CustomUserDetails;
import com.breadbread.bakery.dto.request.CreateBakeryRequest;
import com.breadbread.bakery.dto.request.CreateBreadRequest;
import com.breadbread.bakery.dto.request.UpdateBakeryRequest;
import com.breadbread.bakery.dto.request.UpdateBreadRequest;
import com.breadbread.bakery.service.BakeryService;
import com.breadbread.bakery.service.BreadService;
import com.breadbread.global.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Tag(name = "빵집 - 사장님/관리자")
@RestController
@RequestMapping("/bakeries")
@RequiredArgsConstructor
public class BakeryOwnerController {

    private final BakeryService bakeryService;
    private final BreadService breadService;

    @Operation(summary = "빵집 등록", description = "관리자 또는 빵집 사장님만 가능")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<Long> createBakery(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody CreateBakeryRequest request) {
        return ApiResponse.ok(bakeryService.createBakery(userDetails.getId(), request));
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
        return ApiResponse.ok(
                breadService.createBread(
                        userDetails.getId(), userDetails.getRole(), bakeryId, request));
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
}
