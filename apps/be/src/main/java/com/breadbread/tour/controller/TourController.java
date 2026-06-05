package com.breadbread.tour.controller;

import com.breadbread.auth.dto.CustomUserDetails;
import com.breadbread.global.dto.ApiResponse;
import com.breadbread.tour.dto.CongestionInstantCheckRequest;
import com.breadbread.tour.dto.CongestionInstantCheckResponse;
import com.breadbread.tour.dto.TourCurrentResponse;
import com.breadbread.tour.dto.TourStartResponse;
import com.breadbread.tour.dto.TourVisitResponse;
import com.breadbread.tour.service.TourService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Tag(name = "투어")
@RestController
@RequestMapping("/tours")
@RequiredArgsConstructor
public class TourController {

    private final TourService tourService;

    @Operation(summary = "투어 시작", description = "코스 투어를 시작합니다. 이미 진행 중인 투어가 있으면 409를 반환합니다.")
    @PostMapping("/{courseId}/start")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<TourStartResponse> startTour(
            @AuthenticationPrincipal CustomUserDetails userDetails, @PathVariable Long courseId) {
        return ApiResponse.ok(
                tourService.startTour(userDetails.getId(), userDetails.getRole(), courseId));
    }

    @Operation(summary = "빵집 방문 체크", description = "n번째 빵집 방문을 기록합니다. 마지막 빵집 방문 시 투어가 자동 완료됩니다.")
    @PatchMapping("/{courseId}/visit/{order}")
    public ApiResponse<TourVisitResponse> visitBakery(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long courseId,
            @PathVariable int order) {
        return ApiResponse.ok(tourService.visitBakery(userDetails.getId(), courseId, order));
    }

    @Operation(
            summary = "현재 투어 조회",
            description =
                    "투어 상태를 조회합니다. 앱 재접속 시 상태 복구용으로 사용합니다."
                            + " status 필드가 IN_PROGRESS(진행 중) 또는 COMPLETED(완료 후 1시간 이내) 모두 반환될 수 있습니다.")
    @GetMapping("/current")
    public ApiResponse<TourCurrentResponse> getCurrentTour(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ApiResponse.ok(tourService.getCurrentTour(userDetails.getId()));
    }

    @Operation(summary = "투어 완료 처리", description = "마지막 빵집 방문 외에 명시적으로 투어를 완료합니다.")
    @PostMapping("/{courseId}/complete")
    public ApiResponse<TourCurrentResponse> completeTour(
            @AuthenticationPrincipal CustomUserDetails userDetails, @PathVariable Long courseId) {
        return ApiResponse.ok(tourService.completeTour(userDetails.getId(), courseId));
    }

    @Operation(
            summary = "혼잡도 즉시 체크",
            description =
                    "특정 빵집 또는 코스 내 빵집의 혼잡도를 즉시 분석합니다."
                            + " targetBakeryId를 지정하면 해당 빵집만, 없으면 bakeryIds 전체를 분석합니다.")
    @PostMapping("/congestion-check")
    public ApiResponse<CongestionInstantCheckResponse> checkCongestion(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody @Valid CongestionInstantCheckRequest request) {
        return ApiResponse.ok(tourService.checkCongestionInstant(userDetails.getId(), request));
    }
}
