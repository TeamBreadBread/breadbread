package com.breadbread.auth.dto;

import com.breadbread.auth.entity.AuthType;
import com.breadbread.auth.entity.VerificationPurpose;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class SendPhoneRequest {
    private String phone;
    private AuthType authType;
    private VerificationPurpose purpose;
}
