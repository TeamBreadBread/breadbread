package com.breadbread.auth.dto;

import com.breadbread.global.validator.PasswordPolicy;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class ResetPwRequest {
    @Schema(description = "새 비밀번호 (영문/숫자/특수문자 포함 8자 이상)", example = "NewPassword1!")
    @NotBlank(message = "새 비밀번호는 필수입니다.")
    @PasswordPolicy
    private String newPassword;

    @Schema(description = "새 비밀번호 확인", example = "NewPassword1!")
    @NotBlank(message = "비밀번호 확인은 필수입니다.")
    private String newPasswordConfirm;

    @Schema(description = "휴대전화 인증 완료 후 발급된 토큰", example = "eyJhbGciOiJIUzI1NiJ9...")
    @NotBlank
    private String verificationToken;
}
