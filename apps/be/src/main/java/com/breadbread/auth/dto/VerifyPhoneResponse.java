package com.breadbread.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class VerifyPhoneResponse {
    @Schema(description = "인증 완료 토큰 (회원가입/아이디찾기/비밀번호찾기 요청 시 사용)")
    private String verificationToken;
}
