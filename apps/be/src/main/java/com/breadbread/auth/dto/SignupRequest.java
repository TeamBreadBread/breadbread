package com.breadbread.auth.dto;

import com.breadbread.global.validator.PasswordPolicy;
import com.breadbread.user.entity.UserRole;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class SignupRequest {
    @NotBlank(message = "아이디는 필수입니다.")
    @Pattern(
            regexp = "^[a-z0-9_-]{5,20}$",
            message = "아이디는 5~20자의 영문 소문자, 숫자와 특수기호(_),(-)만 사용 가능합니다."
    )
    private String loginId;
    @NotBlank(message = "비밀번호는 필수입니다.")
    @PasswordPolicy
    private String password;
    @NotBlank(message = "비밀번호 확인은 필수입니다.")
    private String passwordConfirm;
    @NotBlank(message = "이름은 필수입니다.")
    private String name;

    @NotBlank(message = "이메일은 필수입니다.")
    @Email(message = "올바른 이메일 형식이 아닙니다.")
    private String email;

    @NotBlank(message = "휴대전화 번호는 필수입니다.")
    @Pattern(regexp = "^010\\d{8}$", message = "올바른 휴대전화 번호 형식이 아닙니다.")
    private String phone;
    private UserRole role;

    @AssertTrue(message = "이용약관에 동의해주세요.")
    private boolean termsAgreed;

    @AssertTrue(message = "개인정보 처리방침에 동의해주세요.")
    private boolean privacyAgreed;

    @NotBlank
    private String verificationToken;

}
