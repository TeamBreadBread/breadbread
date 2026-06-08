package com.breadbread.trend.controller;

import com.breadbread.global.dto.ApiResponse;
import com.breadbread.trend.dto.TrendBakeryListResponse;
import com.breadbread.trend.dto.TrendBreadListResponse;
import com.breadbread.trend.dto.TrendDiscoverRequest;
import com.breadbread.trend.entity.TrendStatus;
import com.breadbread.trend.service.TrendService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "트렌드")
@RestController
@RequiredArgsConstructor
public class TrendController {

    private final TrendService trendService;

    @Operation(
            summary = "[n8n] 트렌드 키워드 저장",
            description = "n8n에서 수집한 SNS/검색 기반 유행 빵 트렌드 데이터를 저장합니다. X-AI-API-KEY 헤더 필요.")
    @PostMapping("/admin/trends/discover-sync")
    public ApiResponse<Void> discoverSync(@RequestBody @Valid List<TrendDiscoverRequest> requests) {
        trendService.saveAll(requests);
        return ApiResponse.ok();
    }

    @Operation(summary = "유행 빵 키워드 조회", description = "현재 유행 중인 빵 키워드 목록을 trendScore 내림차순으로 반환합니다.")
    @GetMapping("/trends/breads")
    public ApiResponse<TrendBreadListResponse> getBreads(
            @Parameter(description = "트렌드 상태 필터 (RISING / STABLE / FALLING)")
                    @RequestParam(required = false)
                    TrendStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.ok(
                TrendBreadListResponse.from(trendService.getBreads(status, page, size)));
    }

    @Operation(
            summary = "트렌드 빵집 조회",
            description =
                    "트렌드 키워드와 매칭된 빵집 목록을 trendScore 내림차순으로 반환합니다. keyword 파라미터로 특정 키워드의 빵집만 필터링할 수 있습니다.")
    @GetMapping("/trends/bakeries")
    public ApiResponse<TrendBakeryListResponse> getBakeries(
            @Parameter(description = "키워드 필터 (예: 소금빵)") @RequestParam(required = false)
                    String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.ok(
                TrendBakeryListResponse.from(trendService.getBakeries(keyword, page, size)));
    }
}
