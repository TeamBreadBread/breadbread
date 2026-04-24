package com.breadbread.auth.dto;

import com.breadbread.auth.entity.AuthType;
import com.breadbread.auth.entity.VerificationPurpose;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class SendPhoneRequest {
    @Schema(description = "휴대전화 번호 (010으로 시작하는 11자리)", example = "01012345678")
    @NotBlank
    @Pattern(regexp = "^010\\d{8}$", message = "올바른 휴대전화 번호 형식이 아닙니다.")
    private String phone;

    @Schema(description = "인증 수단", example = "SMS")
    private AuthType authType;

    @Schema(description = "인증 목적 (SIGNUP: 회원가입, FIND_ID: 아이디 찾기, FIND_PW: 비밀번호 찾기)", example = "SIGNUP")
    @NotNull
    private VerificationPurpose purpose;
}
