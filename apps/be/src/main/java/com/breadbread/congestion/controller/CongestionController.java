package com.breadbread.congestion.controller;

import com.breadbread.congestion.dto.CongestionResponse;
import com.breadbread.congestion.dto.CongestionSignalRequest;
import com.breadbread.congestion.service.CongestionSignalService;
import com.breadbread.global.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "혼잡도")
@RestController
@RequiredArgsConstructor
public class CongestionController {

    private final CongestionSignalService congestionSignalService;

    @Operation(
            summary = "[n8n] SNS 기반 혼잡도 신호 저장",
            description = "n8n에서 계산한 SNS/검색 기반 혼잡도 결과를 저장합니다. X-AI-API-KEY 헤더 필요.")
    @PostMapping("/admin/congestion/social-signals")
    public ApiResponse<Void> saveSocialSignals(
            @RequestBody @Valid CongestionSignalRequest request) {
        congestionSignalService.save(request);
        return ApiResponse.ok();
    }

    @Operation(summary = "빵집 혼잡도 조회", description = "특정 빵집의 최신 SNS 기반 혼잡도 신호를 조회합니다.")
    @GetMapping("/bakeries/{id}/congestion")
    public ApiResponse<CongestionResponse> getCongestion(
            @Parameter(description = "빵집 ID") @PathVariable Long id) {
        return ApiResponse.ok(congestionSignalService.getByBakeryId(id));
    }

    @Operation(
            summary = "복수 빵집 혼잡도 조회",
            description = "코스 내 여러 빵집의 혼잡도를 한번에 조회합니다. congestionScore 오름차순(덜 붐비는 순) 정렬.")
    @GetMapping("/bakeries/congestion")
    public ApiResponse<List<CongestionResponse>> getCongestionBulk(
            @Parameter(description = "빵집 ID 목록 (쉼표 구분, 예: 1,2,3)") @RequestParam List<Long> ids) {
        return ApiResponse.ok(congestionSignalService.getByBakeryIds(ids));
    }
}
