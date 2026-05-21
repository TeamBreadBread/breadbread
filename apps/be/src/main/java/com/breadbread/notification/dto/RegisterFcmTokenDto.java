package com.breadbread.notification.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Schema(description = "FCM 토큰 등록 요청")
@Getter
@NoArgsConstructor
public class RegisterFcmTokenDto {

    @NotBlank(message = "FCM 토큰은 필수입니다.")
    @Schema(description = "Firebase Cloud Messaging 디바이스 토큰", example = "eKxy1z2A3B4C...")
    private String token;
}
