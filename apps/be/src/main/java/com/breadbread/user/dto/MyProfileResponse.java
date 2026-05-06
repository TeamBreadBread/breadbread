package com.breadbread.user.dto;

import com.breadbread.user.entity.User;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class MyProfileResponse {
    private String loginId;
    private String name;
    private String email;
    private String phone;

    public static MyProfileResponse from(User user) {
        return MyProfileResponse.builder()
                .loginId(user.getLoginId())
                .name(user.getName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .build();
    }
}
