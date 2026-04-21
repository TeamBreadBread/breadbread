package com.breadbread.auth.dto;

import com.breadbread.auth.entity.AuthType;
import com.breadbread.auth.entity.VerificationPurpose;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class SendPhoneRequest {
    @NotBlank
    @Pattern(regexp = "^010\\d{8}$", message = "올바른 휴대전화 번호 형식이 아닙니다.")
    private String phone;
    private AuthType authType;
    @NotNull
    private VerificationPurpose purpose;
}
