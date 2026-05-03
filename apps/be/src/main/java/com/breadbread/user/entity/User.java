package com.breadbread.user.entity;

import com.breadbread.global.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "users")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class User extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(unique = true)
    private String loginId;
    private String password;
    @Column(nullable = false)
    private String name;
	@Column(unique = true)
    private String nickname;
    private String email;
    private String telecom;
	@Column(unique = true)
    private String phone;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private UserRole role;

    @Enumerated(EnumType.STRING)
    private UserGrade grade = UserGrade.MORNING_BREAD;
    private int usageCount = 0;

    @Column(nullable = false)
    private boolean termsAgreed;

    @Column(nullable = false)
    private boolean privacyAgreed;

    private boolean active = true;

    @Builder
    public User(String loginId, String password, String name, String nickname,
                String email, String telecom, String phone, UserRole role,
                boolean termsAgreed, boolean privacyAgreed) {
        this.loginId = loginId;
        this.password = password;
        this.name = name;
        this.nickname = nickname;
        this.email = email;
        this.telecom = telecom;
        this.phone = phone;
        this.role = role;
        this.termsAgreed = termsAgreed;
        this.privacyAgreed = privacyAgreed;
    }

    public void updateNickname(String nickname) {
        this.nickname = nickname;
    }

    public void updatePassword(String password) {
        this.password = password;
    }
}
