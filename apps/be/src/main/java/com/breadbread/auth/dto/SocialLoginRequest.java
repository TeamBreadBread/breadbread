package com.breadbread.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class SocialLoginRequest {
    @Schema(description = "소셜 로그인 제공자로부터 발급받은 인가 코드")
    @NotBlank
    private String code;

    @Schema(
            description = "OAuth 요청 시 사용한 리다이렉트 URI",
            example = "https://breadbread.app/oauth/google/callback")
    @NotBlank
    private String redirectUri;

    @Schema(description = "PKCE code_verifier (PKCE 사용 시 필수)")
    private String codeVerifier;

    @Schema(description = "CSRF 방지용 state 값 (네이버 필수)")
    private String state;
}
