package com.breadbread.user.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class ChangePhoneRequest {
    @Schema(description = "휴대전화 번호 (010으로 시작하는 11자리)", example = "01012345678")
    @NotBlank(message = "휴대전화 번호는 필수입니다.")
    @Pattern(regexp = "^010\\d{8}$", message = "올바른 휴대전화 번호 형식이 아닙니다.")
    private String phone;

    @Schema(description = "휴대전화 인증 완료 후 발급된 토큰", example = "uuid-token-example")
    @NotBlank(message = "인증 토큰은 필수입니다.")
    private String verificationToken;
}
