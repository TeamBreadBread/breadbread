package com.breadbread.notification.controller;

import com.breadbread.auth.dto.CustomUserDetails;
import com.breadbread.global.dto.ApiResponse;
import com.breadbread.notification.dto.CuratorNotificationRequest;
import com.breadbread.notification.dto.RegisterFcmTokenDto;
import com.breadbread.notification.service.FcmService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "알림")
@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final FcmService fcmService;

    @Operation(summary = "FCM 토큰 등록", description = "디바이스 FCM 토큰을 등록합니다. 이미 등록된 토큰이면 무시됩니다.")
    @ResponseStatus(HttpStatus.CREATED)
    @PostMapping("/fcm-token")
    public ApiResponse<Void> registerFcmToken(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody RegisterFcmTokenDto dto) {
        fcmService.registerToken(userDetails.getId(), dto.getToken());
        return ApiResponse.ok();
    }

    @Operation(
            summary = "[n8n] AI 큐레이터 혼잡도 알림 발송",
            description =
                    "n8n이 혼잡도 HIGH 감지 시 호출합니다. 쿨다운(1시간) 내 동일 userId+bakeryId 재발송은 스킵됩니다."
                            + " X-AI-API-KEY 헤더 필요.")
    @PostMapping("/curator")
    public ApiResponse<Void> sendCuratorAlert(
            @RequestBody @Valid CuratorNotificationRequest request) {
        fcmService.sendCuratorAlert(request);
        return ApiResponse.ok();
    }
}
