package com.breadbread.auth.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@Builder
public class SocialUserInfo {
    private String providerUserId;
    private String email;
    private String name;
    private String profileImageUrl;
    private String provider;
    private String nickname;

    @Builder
    public SocialUserInfo(String providerUserId, String email, String name,
                         String nickname, String profileImageUrl, String provider) {
        this.providerUserId = providerUserId;
        this.email = email;
        this.name = name;
        this.nickname = nickname;
        this.profileImageUrl = profileImageUrl;
        this.provider = provider;
    }
}
