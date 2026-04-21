package com.breadbread.auth.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class VerifyPhoneResponse {
    private String verificationToken;
}
