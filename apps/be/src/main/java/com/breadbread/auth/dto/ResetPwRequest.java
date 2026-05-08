package com.breadbread.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class ResetPwRequest {
    @Schema(description = "새 비밀번호 (8~16자, 영문 대/소문자, 숫자, 특수문자 사용 가능)", example = "Bread123!")
    @NotBlank(message = "새 비밀번호는 필수입니다.")
    @Pattern(
            regexp = "^[A-Za-z0-9!@#$%^&*()_+\\-=\\[\\]{};':\",./<>?\\\\|`~]{8,16}$",
            message = "비밀번호는 8~16자의 영문 대/소문자, 숫자, 특수문자만 사용 가능합니다.")
    private String newPassword;

    @Schema(description = "새 비밀번호 확인", example = "NewPassword1!")
    @NotBlank(message = "비밀번호 확인은 필수입니다.")
    private String newPasswordConfirm;

    @Schema(description = "휴대전화 인증 완료 후 발급된 토큰", example = "eyJhbGciOiJIUzI1NiJ9...")
    @NotBlank
    private String verificationToken;
}
