package com.breadbread.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class SocialLoginRequest {
    @Schema(description = "소셜 로그인 제공자로부터 발급받은 액세스 토큰")
    private String accessToken;
}
