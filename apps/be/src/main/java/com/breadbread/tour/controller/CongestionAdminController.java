package com.breadbread.tour.controller;

import com.breadbread.global.dto.ApiResponse;
import com.breadbread.tour.dto.CongestionAlertWebhookResponse;
import com.breadbread.tour.service.CongestionCheckService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "관리자 - 혼잡도")
@RestController
@RequestMapping("/admin/congestion")
@RequiredArgsConstructor
public class CongestionAdminController {

    private final CongestionCheckService congestionCheckService;

    @Operation(
            summary = "혼잡도 체크 수동 트리거",
            description =
                    "현재 투어 중인 모든 사용자에 대해 혼잡도를 즉시 체크하고 알림을 전송합니다."
                            + " 스케줄러(5분 주기)와 동일한 로직을 수동으로 실행합니다."
                            + " ADMIN 권한 필요.")
    @PostMapping("/check")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Void> triggerCongestionCheck() {
        congestionCheckService.checkAndNotify();
        return ApiResponse.ok();
    }

    @Operation(
            summary = "혼잡도 웹훅 직접 호출 (테스트용)",
            description =
                    "웹훅 응답을 즉시 반환합니다. userId가 관리자 계정이면 FCM도 함께 전송합니다."
                            + " 활성 투어가 있으면 실제 투어 상태를 사용하고,"
                            + " 없으면 투어 시작 전(currentVisitOrder=0) 상태로 구성해 웹훅을 호출합니다."
                            + " 쿨다운 등록은 하지 않습니다. ADMIN 권한 필요.")
    @PostMapping("/webhook-test")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<CongestionAlertWebhookResponse> testWebhook(
            @RequestParam Long userId, @RequestParam Long courseId) {
        return ApiResponse.ok(congestionCheckService.testWebhook(userId, courseId));
    }
}
