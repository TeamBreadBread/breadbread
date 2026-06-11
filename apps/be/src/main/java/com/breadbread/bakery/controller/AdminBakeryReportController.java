package com.breadbread.bakery.controller;

import com.breadbread.bakery.dto.response.BakeryReportListResponse;
import com.breadbread.bakery.entity.enums.BakeryStatus;
import com.breadbread.bakery.service.BakeryReportService;
import com.breadbread.global.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@Tag(name = "관리자 - 빵집 제보")
@RestController
@RequestMapping("/admin/bakery-reports")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminBakeryReportController {

    private final BakeryReportService bakeryReportService;

    @Operation(summary = "빵집 제보 목록 조회")
    @Parameter(name = "status", description = "상태 필터 (PENDING / APPROVED / REJECTED, 미입력 시 전체)")
    @GetMapping
    public ApiResponse<BakeryReportListResponse> getReports(
            @RequestParam(required = false) BakeryStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ApiResponse.ok(bakeryReportService.getReports(status, PageRequest.of(page, size)));
    }

    @Operation(
            summary = "빵집 제보 승인",
            description =
                    "NEW_BAKERY 제보 승인 시 PENDING 상태의 빵집 엔티티가 생성됩니다."
                            + " 실제 공개(APPROVED)는 /admin/bakeries/{id}/approve에서 별도로 처리해야 합니다."
                            + " UPDATE_BAKERY 제보 승인 시 ADDRESS·DISTRICT는 자동 반영되며,"
                            + " REPRESENTATIVE_MENU·BUSINESS_HOURS·ETC는 관리자가 수동으로 반영해야 합니다.")
    @PostMapping("/{id}/approve")
    public ApiResponse<Void> approve(@PathVariable Long id) {
        bakeryReportService.approve(id);
        return ApiResponse.ok();
    }

    @Operation(summary = "빵집 제보 거절", description = "제보를 거절합니다. 빵집 엔티티는 생성되지 않습니다.")
    @PostMapping("/{id}/reject")
    public ApiResponse<Void> reject(@PathVariable Long id) {
        bakeryReportService.reject(id);
        return ApiResponse.ok();
    }
}
