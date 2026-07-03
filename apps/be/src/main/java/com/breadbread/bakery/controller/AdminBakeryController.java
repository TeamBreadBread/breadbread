package com.breadbread.bakery.controller;

import com.breadbread.auth.dto.CustomUserDetails;
import com.breadbread.bakery.dto.request.ApproveBakeriesRequest;
import com.breadbread.bakery.dto.request.BakeryImportConfirmRequest;
import com.breadbread.bakery.dto.response.ApproveBakeriesResponse;
import com.breadbread.bakery.dto.response.BakeryAdminListResponse;
import com.breadbread.bakery.dto.response.BakeryAdminResponse;
import com.breadbread.bakery.dto.response.BakeryImportPreviewResponse;
import com.breadbread.bakery.dto.response.KakaoSyncResultResponse;
import com.breadbread.bakery.entity.enums.AdminBakerySortType;
import com.breadbread.bakery.entity.enums.BakeryStatus;
import com.breadbread.bakery.service.BakeryImportRedisService;
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
import jakarta.validation.constraints.NotBlank;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@Tag(name = "관리자 - 빵집")
@RestController
@RequestMapping("/admin/bakeries")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Validated
public class AdminBakeryController {

    private final BakeryService bakeryService;
    private final GooglePlacesUpdateService googlePlacesUpdateService;
    private final GooglePlacesImportService googlePlacesImportService;
    private final KakaoLocalImportService kakaoLocalImportService;
    private final KakaoLocalUpdateService kakaoLocalUpdateService;
    private final BakeryImportRedisService bakeryImportRedisService;

    @Operation(
            summary = "구글 Places 키워드로 빵집 검색 (미리보기)",
            description =
                    "검색 결과를 DB에 저장하지 않고 Redis에 임시 캐시한 뒤 후보 목록을 반환한다. 이미 존재하는 빵집/프랜차이즈는 후보에서 제외됨.\n\n"
                            + "후보 중 원하는 것만 골라 `searchId`와 함께 `POST /admin/bakeries/import/confirm`을 호출하면 실제로 저장된다."
                            + " 캐시는 일정 시간 후 만료되며, 만료 전에는 `GET /admin/bakeries/import/search/{searchId}`로 다시 조회할 수 있다.")
    @Parameter(name = "keyword", description = "검색 키워드", example = "대전 빵집")
    @PostMapping("/import/search")
    public ApiResponse<BakeryImportPreviewResponse> searchBakeries(
            @RequestParam @NotBlank String keyword) {
        return ApiResponse.ok(googlePlacesImportService.searchByKeyword(keyword));
    }

    @Operation(
            summary = "구글 Places 검색 후보 확정 저장",
            description =
                    "`searchId`로 캐시된 후보 중 선택한 `candidateIds`만 PENDING 상태로 저장한다. 이미 존재하는 빵집은 스킵.\n\n"
                            + "**저장 시 채워지는 필드**\n"
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
    @PostMapping("/import/confirm")
    public ApiResponse<List<String>> confirmImport(
            @Valid @RequestBody BakeryImportConfirmRequest request) {
        return ApiResponse.ok(
                googlePlacesImportService.confirmImport(
                        request.getSearchId(), request.getCandidateIds()));
    }

    @Operation(
            summary = "캐시된 검색 결과 다시 보기",
            description =
                    "`searchId`로 Redis에 캐시된 검색 결과(키워드/후보 목록)를 그대로 다시 조회한다."
                            + " 구글 Places/카카오 로컬 검색 결과 모두 조회 가능하며, 캐시가 만료되었으면 404를 반환한다.")
    @GetMapping("/import/search/{searchId}")
    public ApiResponse<BakeryImportPreviewResponse> getCachedSearch(@PathVariable String searchId) {
        return ApiResponse.ok(bakeryImportRedisService.getPreview(searchId));
    }

    @Operation(
            summary = "카카오 로컬 키워드로 빵집 검색 (미리보기)",
            description =
                    "검색 결과를 DB에 저장하지 않고 Redis에 임시 캐시한 뒤 후보 목록을 반환한다. 이미 존재하는 빵집/프랜차이즈/빵집이 아닌 카테고리는 후보에서 제외됨.\n\n"
                            + "후보 중 원하는 것만 골라 `searchId`와 함께 `POST /admin/bakeries/import/kakao/confirm`을 호출하면 실제로 저장된다."
                            + " 캐시는 일정 시간 후 만료된다.")
    @Parameter(name = "keyword", description = "검색 키워드", example = "대전 빵집")
    @PostMapping("/import/kakao/search")
    public ApiResponse<BakeryImportPreviewResponse> searchBakeriesFromKakao(
            @RequestParam @NotBlank String keyword) {
        return ApiResponse.ok(kakaoLocalImportService.searchByKeyword(keyword));
    }

    @Operation(
            summary = "카카오 로컬 검색 후보 확정 저장",
            description =
                    "`searchId`로 캐시된 후보 중 선택한 `candidateIds`만 PENDING 상태로 저장한다. 이미 존재하는 빵집은 스킵.\n\n"
                            + "**저장 시 채워지는 필드**\n"
                            + "- `name` — 빵집 이름\n"
                            + "- `address` — 도로명 주소 (없으면 지번 주소)\n"
                            + "- `region` — 지역구\n"
                            + "- `latitude` / `longitude` — 위경도\n"
                            + "- `phone` — 전화번호\n\n"
                            + "영업시간 등 나머지 필드는 승인 전 직접 입력 필요.")
    @PostMapping("/import/kakao/confirm")
    public ApiResponse<List<String>> confirmImportFromKakao(
            @Valid @RequestBody BakeryImportConfirmRequest request) {
        return ApiResponse.ok(
                kakaoLocalImportService.confirmImport(
                        request.getSearchId(), request.getCandidateIds()));
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
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody @Valid ApproveBakeriesRequest request) {
        return ApiResponse.ok(bakeryService.approveBakeries(userDetails.getId(), request.getIds()));
    }

    @Operation(
            summary = "빵집 전체 일괄 승인 (PENDING → APPROVED)",
            description = "현재 PENDING 상태인 빵집을 모두 승인합니다. " + "필수 항목 미충족 빵집은 스킵되며 응답에 포함됩니다.")
    @PostMapping("/approve-all")
    public ApiResponse<ApproveBakeriesResponse> approveAllBakeries(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ApiResponse.ok(bakeryService.approveAllPendingBakeries(userDetails.getId()));
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
