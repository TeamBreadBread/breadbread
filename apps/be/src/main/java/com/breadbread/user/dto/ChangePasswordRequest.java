package com.breadbread.user.dto;

import com.breadbread.global.validation.ValidationPatterns;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class ChangePasswordRequest {
    @Schema(description = "현재 비밀번호", example = "OldBread123!")
    @NotBlank(message = "현재 비밀번호는 필수입니다.")
    private String currentPassword;

    @Schema(description = "새 비밀번호 (8~16자, 영문 대/소문자, 숫자, 특수문자 사용 가능)", example = "NewBread456!")
    @NotBlank(message = "새 비밀번호는 필수입니다.")
    @Pattern(
            regexp = ValidationPatterns.ACCOUNT_PASSWORD,
            message = ValidationPatterns.ACCOUNT_PASSWORD_MESSAGE)
    private String newPassword;

    @Schema(description = "새 비밀번호 확인", example = "NewBread456!")
    @NotBlank(message = "새 비밀번호 확인은 필수입니다.")
    private String newPasswordConfirm;
}
