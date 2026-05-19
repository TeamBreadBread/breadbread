package com.breadbread.user.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;

@Schema(description = "유저 프로필 응답")
@Getter
@Builder
public class UserProfileResponse {

    @Schema(description = "회원 고유 ID (JWT subject와 동일)", example = "42")
    private Long userId;

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

    @Schema(description = "등급명", example = "모닝빵")
    private String grade;

    @Schema(description = "등급 설명", example = "빵빵에 갓 도착한 작고 소중한 신입")
    private String gradeDescription;

    @Schema(description = "다음 등급까지 남은 횟수 (최고 등급이면 0)", example = "3")
    private int remainingCountToNextGrade;

    @Schema(description = "프로필 이미지 URL", example = "https://storage.example.com/profile/abc.jpg")
    private String profileImageUrl;

    @Schema(description = "소셜 로그인 계정 여부", example = "false")
    private boolean socialUser;
}
