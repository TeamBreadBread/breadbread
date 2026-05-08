package com.breadbread.auth.redis;

import com.breadbread.auth.entity.VerificationPurpose;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PhoneVerificationCache {
    private String phone;
    private String code;
    private VerificationPurpose purpose;
    private boolean verified;
    private String verificationToken;
}
