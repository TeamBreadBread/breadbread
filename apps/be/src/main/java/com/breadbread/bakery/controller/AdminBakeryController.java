package com.breadbread.bakery.controller;

import com.breadbread.bakery.dto.request.ApproveBakeriesRequest;
import com.breadbread.bakery.dto.response.ApproveBakeriesResponse;
import com.breadbread.bakery.dto.response.BakeryAdminListResponse;
import com.breadbread.bakery.dto.response.BakeryAdminResponse;
import com.breadbread.bakery.dto.response.KakaoSyncResultResponse;
import com.breadbread.bakery.entity.enums.AdminBakerySortType;
import com.breadbread.bakery.entity.enums.BakeryStatus;
import com.breadbread.bakery.service.BakeryService;
import com.breadbread.bakery.service.GooglePlacesImportService;
import com.breadbread.bakery.service.GooglePlacesUpdateService;
import com.breadbread.bakery.service.KakaoLocalImportService;
import com.breadbread.bakery.service.KakaoLocalUpdateService;
import com.breadbread.global.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
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
    private final KakaoLocalImportService kakaoLocalImportService;
    private final KakaoLocalUpdateService kakaoLocalUpdateService;

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
    public ApiResponse<List<String>> importBakeries(@RequestParam String keyword) {
        return ApiResponse.ok(googlePlacesImportService.importByKeyword(keyword));
    }

    @Operation(
            summary = "카카오 로컬 키워드로 빵집 임포트",
            description =
                    "카카오 로컬 API 검색 결과를 PENDING 상태로 저장한다. 이미 존재하는 빵집은 스킵.\n\n"
                            + "**임포트 시 채워지는 필드**\n"
                            + "- `name` — 빵집 이름\n"
                            + "- `address` — 도로명 주소 (없으면 지번 주소)\n"
                            + "- `region` — 지역구\n"
                            + "- `latitude` / `longitude` — 위경도\n"
                            + "- `phone` — 전화번호\n\n"
                            + "영업시간 등 나머지 필드는 승인 전 직접 입력 필요.")
    @Parameter(name = "keyword", description = "검색 키워드", example = "대전 빵집")
    @PostMapping("/import/kakao")
    public ApiResponse<List<String>> importBakeriesFromKakao(@RequestParam String keyword) {
        return ApiResponse.ok(kakaoLocalImportService.importByKeyword(keyword));
    }

    @Operation(summary = "빵집 목록 조회 (상태 필터 / 키워드 검색 / 정렬)")
    @Parameter(name = "status", description = "빵집 상태 필터 (PENDING / APPROVED / REJECTED, 미입력 시 전체)")
    @Parameter(name = "active", description = "활성 여부 (true: 정상, false: 소프트삭제된 빵집, 기본값 true)")
    @Parameter(name = "keyword", description = "빵집 이름 키워드 검색")
    @Parameter(
            name = "sort",
            description =
                    "정렬 기준 (CREATED_AT_DESC: 최신순(기본값) / CREATED_AT_ASC: 오래된순 / NAME_ASC: 이름순)")
    @GetMapping
    public ApiResponse<BakeryAdminListResponse> getBakeries(
            @RequestParam(required = false) BakeryStatus status,
            @RequestParam(defaultValue = "true") boolean active,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "CREATED_AT_DESC") AdminBakerySortType sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ApiResponse.ok(
                bakeryService.getBakeriesByStatus(
                        status, active, keyword, sort, PageRequest.of(page, size)));
    }

    @Operation(
            summary = "빵집 상세 조회 (관리자)",
            description = "PENDING / REJECTED 포함 모든 상태의 빵집 상세를 조회합니다.")
    @GetMapping("/{id}")
    public ApiResponse<BakeryAdminResponse> getBakery(@PathVariable Long id) {
        return ApiResponse.ok(bakeryService.getBakeryAdmin(id));
    }

    @Operation(
            summary = "빵집 일괄 승인 (PENDING → APPROVED)",
            description =
                    "PENDING 상태의 빵집을 최종 승인합니다. 승인 전 아래 필드가 모두 채워졌는지 확인하세요.\n\n"
                            + "**필수 확인 항목** (미충족 시 해당 빵집만 스킵)\n"
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
    @PostMapping("/approve")
    public ApiResponse<ApproveBakeriesResponse> approveBakeries(
            @RequestBody @Valid ApproveBakeriesRequest request) {
        return ApiResponse.ok(bakeryService.approveBakeries(request.getIds()));
    }

    @Operation(
            summary = "빵집 전체 일괄 승인 (PENDING → APPROVED)",
            description = "현재 PENDING 상태인 빵집을 모두 승인합니다. " + "필수 항목 미충족 빵집은 스킵되며 응답에 포함됩니다.")
    @PostMapping("/approve-all")
    public ApiResponse<ApproveBakeriesResponse> approveAllBakeries() {
        return ApiResponse.ok(bakeryService.approveAllPendingBakeries());
    }

    @Operation(summary = "빵집 등록 거절 (PENDING → REJECTED)")
    @PostMapping("/{id}/reject")
    public ApiResponse<Void> rejectBakery(@PathVariable Long id) {
        bakeryService.rejectBakery(id);
        return ApiResponse.ok();
    }

    @Operation(
            summary = "PENDING/REJECTED 빵집 전체 영구 삭제",
            description = "PENDING 또는 REJECTED 상태의 빵집을 DB에서 완전히 삭제한다. APPROVED 상태는 삭제 불가.")
    @Parameter(name = "status", description = "삭제할 상태 (PENDING 또는 REJECTED)")
    @DeleteMapping
    public ApiResponse<Integer> hardDeleteByStatus(@RequestParam BakeryStatus status) {
        return ApiResponse.ok(bakeryService.hardDeleteByStatus(status));
    }

    @Operation(
            summary = "특정 빵집 영구 삭제",
            description =
                    "PENDING 또는 REJECTED 상태의 특정 빵집을 DB에서 완전히 삭제한다. 소프트삭제된 빵집도 삭제 가능. APPROVED 상태는 삭제 불가.")
    @DeleteMapping("/{id}/hard")
    public ApiResponse<Void> hardDeleteBakery(@PathVariable Long id) {
        bakeryService.hardDeleteBakery(id);
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
            description =
                    "APPROVED 상태인 모든 활성 빵집의 이미지를 구글 Places API로 동기화한다. GCS 이미지가 이미 있는 빵집은 스킵.\n\n"
                            + "**스킵 기준**\n"
                            + "- 구글 검색 결과가 없는 경우\n"
                            + "- 가장 가까운 후보가 300m 초과인 경우")
    @PostMapping("/sync-places")
    public ApiResponse<KakaoSyncResultResponse> syncAllPlaces() {
        return ApiResponse.ok(googlePlacesUpdateService.syncAllBakeries());
    }

    @Operation(
            summary = "특정 빵집 카카오 로컬 동기화",
            description =
                    "카카오 로컬 API로 특정 빵집의 정보를 업데이트한다. 상태 무관하게 동작.\n\n"
                            + "**업데이트 필드**\n"
                            + "- `phone` — 전화번호\n"
                            + "- `dong` — 행정동\n"
                            + "- `region` — 지역구 (예: 대전 중구)\n"
                            + "- `address` — 도로명 주소 (없으면 지번 주소)\n"
                            + "- `latitude` / `longitude` / `location` — 위경도\n\n"
                            + "빵집 이름으로 검색 후 좌표 기준 200m 이내 동일 이름의 장소가 있을 때만 업데이트된다.")
    @PostMapping("/{id}/sync-kakao")
    public ApiResponse<Void> syncKakao(@PathVariable Long id) {
        kakaoLocalUpdateService.syncBakery(id);
        return ApiResponse.ok();
    }

    @Operation(
            summary = "전체 빵집 카카오 로컬 동기화",
            description =
                    "APPROVED 상태인 모든 활성 빵집의 정보를 카카오 로컬 API로 업데이트한다. 실패한 빵집 목록을 응답에 포함.\n\n"
                            + "**업데이트 필드**\n"
                            + "- `phone` — 전화번호\n"
                            + "- `dong` — 행정동\n"
                            + "- `region` — 지역구 (예: 대전 중구)\n"
                            + "- `address` — 도로명 주소 (없으면 지번 주소)\n"
                            + "- `latitude` / `longitude` / `location` — 위경도")
    @PostMapping("/sync-kakao")
    public ApiResponse<KakaoSyncResultResponse> syncAllKakao() {
        return ApiResponse.ok(kakaoLocalUpdateService.syncAllBakeries());
    }
}
