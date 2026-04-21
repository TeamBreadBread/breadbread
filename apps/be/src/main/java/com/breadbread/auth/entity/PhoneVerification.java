package com.breadbread.auth.entity;

import com.breadbread.global.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PhoneVerification extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String phone;
    private boolean verified = false;
    private String code;
    private LocalDateTime expiredAt;
    @Enumerated(EnumType.STRING)
    private AuthType authType;
    @Enumerated(EnumType.STRING)
    private VerificationPurpose purpose;
    private String verificationToken;

    @Builder
    public PhoneVerification(String phone, String code, LocalDateTime expiredAt,
                             VerificationPurpose purpose, AuthType authType) {
        this.phone = phone;
        this.code = code;
        this.expiredAt = expiredAt;
        this.authType = authType;
        this.purpose = purpose;
    }

    public String verify() {
        this.verified = true;
        this.verificationToken = UUID.randomUUID().toString();
        this.expiredAt = LocalDateTime.now().plusMinutes(10); // 인증 후 10분 안에 회원가입
        return verificationToken;
    }
}
