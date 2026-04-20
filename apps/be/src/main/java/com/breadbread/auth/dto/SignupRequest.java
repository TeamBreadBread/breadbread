package com.breadbread.auth.dto;

import com.breadbread.user.entity.UserRole;
import lombok.Getter;

@Getter
public class SignupRequest {
    private String loginId;
    private String password;
    private String passwordConfirm;
    private String name;
    private String email;
    private String phone;
    private String verificationToken;
    private UserRole role;
    private boolean termsAgreed;
    private boolean privacyAgreed;

}
