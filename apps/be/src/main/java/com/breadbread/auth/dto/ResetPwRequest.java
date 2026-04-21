package com.breadbread.auth.dto;

import com.breadbread.global.validator.PasswordPolicy;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class ResetPwRequest {
    @NotBlank(message = "새 비밀번호는 필수입니다.")
    @PasswordPolicy
    private String newPassword;
    @NotBlank(message = "비밀번호 확인은 필수입니다.")
    private String newPasswordConfirm;
    @NotBlank
    private String verificationToken;
}
