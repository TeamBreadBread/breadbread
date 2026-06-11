package com.breadbread.bakery.controller;

import com.breadbread.bakery.dto.BakeryAdminListResponse;
import com.breadbread.bakery.entity.BakeryStatus;
import com.breadbread.bakery.service.BakeryService;
import com.breadbread.global.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@Tag(name = "관리자 - 빵집")
@RestController
@RequestMapping("/admin/bakeries")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminBakeryController {

    private final BakeryService bakeryService;

    @Operation(summary = "빵집 목록 조회 (상태 필터)")
    @Parameter(name = "status", description = "빵집 상태 필터 (PENDING / APPROVED / REJECTED, 미입력 시 전체)")
    @GetMapping
    public ApiResponse<BakeryAdminListResponse> getBakeries(
            @RequestParam(required = false) BakeryStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ApiResponse.ok(
                bakeryService.getBakeriesByStatus(status, PageRequest.of(page, size)));
    }

    @Operation(
            summary = "빵집 등록 승인 (PENDING → APPROVED)",
            description =
                    "PENDING 상태의 빵집을 최종 승인합니다. 승인 전 아래 필드가 모두 채워졌는지 확인하세요.\n\n"
                            + "**필수 확인 항목** (미입력 시 400 오류)\n"
                            + "- `name` — 빵집 이름\n"
                            + "- `address` — 주소\n"
                            + "- `latitude` / `longitude` — 위경도 (0.0이면 미입력 상태)\n"
                            + "- `region` — 지역구\n"
                            + "- `dong` — 행정동\n"
                            + "- `bakeryType` — 빵집 유형\n\n"
                            + "**권장 확인 항목**\n"
                            + "- `phone` — 전화번호\n"
                            + "- `mapLink` — 지도 링크\n"
                            + "- `businessHours` — 영업 시간\n\n"
                            + "승인 후 일반 사용자에게 노출되며 AI 코스 추천 대상에도 포함됩니다.")
    @PostMapping("/{id}/approve")
    public ApiResponse<Void> approveBakery(@PathVariable Long id) {
        bakeryService.approveBakery(id);
        return ApiResponse.ok();
    }

    @Operation(summary = "빵집 등록 거절 (PENDING → REJECTED)")
    @PostMapping("/{id}/reject")
    public ApiResponse<Void> rejectBakery(@PathVariable Long id) {
        bakeryService.rejectBakery(id);
        return ApiResponse.ok();
    }
}
