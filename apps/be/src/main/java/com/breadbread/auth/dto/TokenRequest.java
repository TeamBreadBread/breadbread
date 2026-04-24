package com.breadbread.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class TokenRequest {
    @Schema(description = "리프레시 토큰")
    @NotBlank
    private String refreshToken;
}
