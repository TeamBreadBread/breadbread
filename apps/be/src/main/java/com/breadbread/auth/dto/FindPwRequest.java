package com.breadbread.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class FindPwRequest {
    @Schema(description = "로그인 아이디", example = "breaduser123")
    @NotBlank(message = "아이디는 필수입니다.")
    private String loginId;

    @Schema(description = "이름", example = "홍길동")
    @NotBlank(message = "이름은 필수입니다.")
    private String name;

    @Schema(description = "휴대전화 번호", example = "01012345678")
    @NotBlank(message = "전화번호는 필수입니다.")
    private String phone;

    @Schema(description = "휴대전화 인증 완료 후 발급된 토큰", example = "eyJhbGciOiJIUzI1NiJ9...")
    @NotBlank
    private String verificationToken;
}
