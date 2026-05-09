package com.breadbread.user.dto;

import com.breadbread.user.entity.User;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class MyProfileResponse {
    /** {@code GET /users/me} 응답과 동일하게 식별용으로 내려줄 수 있음 */
    private Long userId;

    private String loginId;
    private String name;
    private String email;
    private String phone;

    public static MyProfileResponse from(User user) {
        return MyProfileResponse.builder()
                .userId(user.getId())
                .loginId(user.getLoginId())
                .name(user.getName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .build();
    }
}
