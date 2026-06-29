package com.breadbread.bakery.controller;

import com.breadbread.auth.dto.CustomUserDetails;
import com.breadbread.bakery.dto.request.CreateMenuReportRequest;
import com.breadbread.bakery.dto.request.CreateNewBakeryReportRequest;
import com.breadbread.bakery.dto.request.CreateUpdateBakeryReportRequest;
import com.breadbread.bakery.service.BakeryReportService;
import com.breadbread.global.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Tag(name = "빵집 제보")
@RestController
@RequestMapping("/bakeries/reports")
@RequiredArgsConstructor
public class BakeryReportController {

    private final BakeryReportService bakeryReportService;

    @Operation(
            summary = "새 빵집 등록 제보",
            description =
                    "제보를 등록합니다. 관리자가 제보를 승인하면 PENDING 상태의 빵집이 생성되며,"
                            + " 최종 공개(APPROVED)는 /admin/bakeries/{id}/approve에서 별도로 처리됩니다.")
    @PostMapping("/new")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<Long> submitNew(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody CreateNewBakeryReportRequest request) {
        return ApiResponse.ok(bakeryReportService.submitNew(userDetails.getId(), request));
    }

    @Operation(summary = "빵집 정보 수정 제보", description = "기존 빵집의 주소, 행정동, 메뉴 등 정보 수정을 요청합니다.")
    @PostMapping("/update")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<Long> submitUpdate(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody CreateUpdateBakeryReportRequest request) {
        return ApiResponse.ok(bakeryReportService.submitUpdate(userDetails.getId(), request));
    }

    @Operation(summary = "메뉴 건의", description = "등록된 빵집에 빠진 메뉴를 건의합니다.")
    @PostMapping("/menu")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<Long> submitMenu(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody CreateMenuReportRequest request) {
        return ApiResponse.ok(bakeryReportService.submitMenu(userDetails.getId(), request));
    }
}
