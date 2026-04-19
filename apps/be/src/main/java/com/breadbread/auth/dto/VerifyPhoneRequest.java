package com.breadbread.auth.dto;

import com.breadbread.auth.entity.VerificationPurpose;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class VerifyPhoneRequest {
    private String phone;
    private String code;
    private VerificationPurpose purpose;
}
