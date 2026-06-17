package com.breadbread.user.dto;

import com.breadbread.global.validation.NotBlankIfPresent;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class UpdateProfileRequest {
    @Schema(description = "닉네임", example = "빵순이")
    @NotBlankIfPresent
    private String nickname;

    @Schema(description = "이메일", example = "bread@example.com")
    @NotBlankIfPresent
    @Email(message = "올바른 이메일 형식이 아닙니다.")
    private String email;

    @Schema(description = "프로필 이미지 URL", example = "https://storage.example.com/profile/abc.jpg")
    private String profileImageUrl;
}
