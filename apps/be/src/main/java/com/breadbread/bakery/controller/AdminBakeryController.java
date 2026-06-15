package com.breadbread.bakery.controller;

import com.breadbread.bakery.dto.response.BakeryAdminListResponse;
import com.breadbread.bakery.entity.enums.BakeryStatus;
import com.breadbread.bakery.service.BakeryService;
import com.breadbread.bakery.service.GooglePlacesImportService;
import com.breadbread.bakery.service.GooglePlacesUpdateService;
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
    private final GooglePlacesUpdateService googlePlacesUpdateService;
    private final GooglePlacesImportService googlePlacesImportService;

    @Operation(
            summary = "구글 Places 키워드로 빵집 임포트",
            description =
                    "검색 결과를 PENDING 상태로 저장한다. 이미 존재하는 빵집은 스킵.\n\n"
                            + "**임포트 시 채워지는 필드**\n"
                            + "- `name` — 빵집 이름\n"
                            + "- `address` — 주소\n"
                            + "- `region` — 지역구\n"
                            + "- `latitude` / `longitude` — 위경도\n"
                            + "- `phone` — 전화번호\n"
                            + "- `weekdayOpen` / `weekdayClose` — 평일 영업 시간\n"
                            + "- `weekendOpen` / `weekendClose` — 주말 영업 시간\n"
                            + "- `closedDays` — 정기 휴무일\n"
                            + "- `placeId` — 구글 Places ID\n\n"
                            + "나머지 필드(`region`, `bakeryType` 등)는 승인 전 직접 입력 필요.")
    @Parameter(name = "keyword", description = "검색 키워드", example = "대전 빵집")
    @PostMapping("/import")
    public ApiResponse<Integer> importBakeries(@RequestParam String keyword) {
        return ApiResponse.ok(googlePlacesImportService.importByKeyword(keyword));
    }

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

    @Operation(
            summary = "빵집 구글 Places 동기화",
            description = "구글 Places API로 placeId를 동기화하고, GCS 이미지가 없으면 사진도 업데이트한다.")
    @PostMapping("/{id}/sync-places")
    public ApiResponse<Void> syncPlaces(@PathVariable Long id) {
        googlePlacesUpdateService.syncBakery(id);
        return ApiResponse.ok();
    }

    @Operation(
            summary = "전체 빵집 구글 Places 동기화",
            description = "활성 상태인 모든 빵집을 구글 Places API와 동기화한다. 개별 실패는 무시하고 계속 진행한다.")
    @PostMapping("/sync-places")
    public ApiResponse<Void> syncAllPlaces() {
        googlePlacesUpdateService.syncAllBakeries();
        return ApiResponse.ok();
    }
}
