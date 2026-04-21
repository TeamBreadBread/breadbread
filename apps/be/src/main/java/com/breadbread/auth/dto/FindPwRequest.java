package com.breadbread.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class FindPwRequest {
    @NotBlank(message = "아이디는 필수입니다.")
    private String loginId;
    @NotBlank(message = "이름은 필수입니다.")
    private String name;
    @NotBlank(message = "전화번호는 필수입니다.")
    private String phone;
    @NotBlank
    private String verificationToken;
}
