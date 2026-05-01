package com.breadbread.auth.dto;

import com.breadbread.user.entity.UserRole;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class SignupRequest {
    @Schema(description = "로그인 아이디 (5~20자, 영문 소문자/숫자/_/-)", example = "breaduser123")
    @NotBlank(message = "아이디는 필수입니다.")
    @Pattern(
            regexp = "^[a-z0-9_-]{5,20}$",
            message = "아이디는 5~20자의 영문 소문자, 숫자와 특수기호(_),(-)만 사용 가능합니다."
    )
    private String loginId;

    @Schema(description = "비밀번호 (8~16자, 영문 대/소문자, 숫자, 특수문자 사용 가능)", example = "Bread123!")
    @NotBlank(message = "비밀번호는 필수입니다.")
    @Pattern(
            regexp = "^[A-Za-z0-9!@#$%^&*()_+\\-=\\[\\]{};':\",./<>?\\\\|`~]{8,16}$",
            message = "비밀번호는 8~16자의 영문 대/소문자, 숫자, 특수문자만 사용 가능합니다."
    )
    private String password;

    @Schema(description = "비밀번호 확인", example = "Bread123!")
    @NotBlank(message = "비밀번호 확인은 필수입니다.")
    private String passwordConfirm;

    @Schema(description = "이름", example = "홍길동")
    @NotBlank(message = "이름은 필수입니다.")
    private String name;

    @Schema(description = "이메일", example = "breaduser@example.com")
    @NotBlank(message = "이메일은 필수입니다.")
    @Email(message = "올바른 이메일 형식이 아닙니다.")
    private String email;

    @Schema(description = "휴대전화 번호 (010으로 시작하는 11자리)", example = "01012345678")
    @NotBlank(message = "휴대전화 번호는 필수입니다.")
    @Pattern(regexp = "^010\\d{8}$", message = "올바른 휴대전화 번호 형식이 아닙니다.")
    private String phone;

    @Schema(description = "회원 역할", example = "USER")
    private UserRole role;

    @Schema(description = "이용약관 동의 여부", example = "true")
    @AssertTrue(message = "이용약관에 동의해주세요.")
    private boolean termsAgreed;

    @Schema(description = "개인정보 처리방침 동의 여부", example = "true")
    @AssertTrue(message = "개인정보 처리방침에 동의해주세요.")
    private boolean privacyAgreed;

    @Schema(description = "휴대전화 인증 완료 후 발급된 토큰", example = "eyJhbGciOiJIUzI1NiJ9...")
    @NotBlank
    private String verificationToken;
}
