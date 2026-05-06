package com.breadbread.user.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;

@Schema(description = "유저 프로필 응답")
@Getter
@Builder
public class UserProfileResponse {

    @Schema(description = "로그인 아이디", example = "breadlover123")
    private String loginId;

    @Schema(description = "이름", example = "홍길동")
    private String name;

    @Schema(description = "닉네임", example = "빵순이")
    private String nickname;

    @Schema(description = "이메일", example = "bread@example.com")
    private String email;

    @Schema(description = "전화번호", example = "010-1234-5678")
    private String phone;

    @Schema(description = "등급", example = "모닝빵")
    private String grade;

    @Schema(description = "프로필 이미지 URL", example = "https://storage.example.com/profile/abc.jpg")
    private String profileImageUrl;
}
