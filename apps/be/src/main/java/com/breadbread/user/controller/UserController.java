package com.breadbread.user.controller;

import com.breadbread.auth.dto.CustomUserDetails;
import com.breadbread.bakery.dto.response.BakeryListResponse;
import com.breadbread.bakery.dto.response.MyReviewListResponse;
import com.breadbread.community.dto.PostListResponse;
import com.breadbread.course.dto.response.CourseListResponse;
import com.breadbread.global.dto.ApiResponse;
import com.breadbread.global.exception.CustomException;
import com.breadbread.global.exception.ErrorCode;
import com.breadbread.user.dto.ChangePasswordRequest;
import com.breadbread.user.dto.ChangePhoneRequest;
import com.breadbread.user.dto.CreatePreferenceRequest;
import com.breadbread.user.dto.PreferenceResponse;
import com.breadbread.user.dto.UpdatePreferenceRequest;
import com.breadbread.user.dto.UpdateProfileRequest;
import com.breadbread.user.dto.UserProfileResponse;
import com.breadbread.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@Tag(name = "유저")
@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@Validated
public class UserController {
    private final UserService userService;

    @Operation(summary = "내 프로필 조회")
    @GetMapping("/me")
    public ApiResponse<UserProfileResponse> getMyProfile(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ApiResponse.ok(userService.getUserProfile(userDetails.getId()));
    }

    @Operation(summary = "닉네임 중복 확인", description = "사용 가능하면 true, 중복이면 false를 반환합니다.")
    @GetMapping("/check-nickname")
    public ApiResponse<Boolean> checkNickname(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @NotBlank(message = "닉네임은 필수입니다.") @RequestParam String nickname) {
        return ApiResponse.ok(userService.checkNicknameAvailable(nickname, userDetails.getId()));
    }

    @Operation(
            summary = "내 프로필 수정",
            description = "수정할 필드만 포함하여 요청하면 됩니다. 포함되지 않은 필드는 기존 값이 유지됩니다.")
    @PatchMapping("/me")
    public ApiResponse<Void> updateMyProfile(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody UpdateProfileRequest request) {
        userService.updateProfile(userDetails.getId(), request);
        return ApiResponse.ok();
    }

    @Operation(
            summary = "전화번호 변경",
            description =
                    "전화번호 변경 및 최초 등록(소셜 로그인 유저 등)에도 사용 가능합니다. 사전에 CHANGE_PHONE 목적으로 전화번호 인증을 완료해야 합니다.")
    @PatchMapping("/me/phone")
    public ApiResponse<Void> changePhone(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody ChangePhoneRequest request) {
        userService.changePhone(userDetails.getId(), request);
        return ApiResponse.ok();
    }

    @Operation(
            summary = "비밀번호 수정",
            description = "현재 비밀번호를 확인한 뒤 새 비밀번호로 변경합니다. 소셜 전용 계정은 사용할 수 없습니다.")
    @PatchMapping("/me/password")
    public ApiResponse<Void> changePassword(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(userDetails.getId(), request);
        return ApiResponse.ok();
    }

    @Operation(
            summary = "선호도 조사 등록",
            description = "빵집 유형, 분위기, 이용 목적, 대기 허용 시간을 등록합니다. 선호도는 1회만 등록 가능합니다.")
    @ResponseStatus(HttpStatus.CREATED)
    @PostMapping("/preference")
    public ApiResponse<Void> savePreference(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody CreatePreferenceRequest request) {
        if (userDetails == null) {
            throw new CustomException(ErrorCode.UNAUTHORIZED);
        }
        userService.savePreference(userDetails.getId(), request);
        return ApiResponse.ok();
    }

    @Operation(summary = "내 선호도 조회", description = "등록된 선호도가 없으면 null을 반환합니다.")
    @GetMapping("/preference")
    public ApiResponse<PreferenceResponse> getPreference(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ApiResponse.ok(userService.getPreference(userDetails.getId()));
    }

    @Operation(summary = "내가 쓴 리뷰 목록 조회", description = "페이지 단위로 조회합니다. page는 0부터 시작합니다.")
    @GetMapping("/me/reviews")
    public ApiResponse<MyReviewListResponse> getMyReviews(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Positive int size) {
        return ApiResponse.ok(userService.getMyReviews(userDetails.getId(), page, size));
    }

    @Operation(summary = "좋아요한 빵집 목록 조회", description = "페이지 단위로 조회합니다. page는 0부터 시작합니다.")
    @GetMapping("/me/liked/bakeries")
    public ApiResponse<BakeryListResponse> getLikedBakeries(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Positive int size) {
        return ApiResponse.ok(userService.getLikedBakeries(userDetails.getId(), page, size));
    }

    @Operation(summary = "좋아요한 코스 목록 조회", description = "페이지 단위로 조회합니다. page는 0부터 시작합니다.")
    @GetMapping("/me/liked/courses")
    public ApiResponse<CourseListResponse> getLikedCourses(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Positive int size) {
        return ApiResponse.ok(userService.getLikedCourses(userDetails.getId(), page, size));
    }

    @Operation(summary = "내가 쓴 게시글 목록 조회", description = "페이지 단위로 조회합니다. page는 0부터 시작합니다.")
    @GetMapping("/me/posts")
    public ApiResponse<PostListResponse> getMyPosts(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Positive int size) {
        return ApiResponse.ok(userService.getMyPosts(userDetails.getId(), page, size));
    }

    @Operation(summary = "좋아요한 게시글 목록 조회", description = "페이지 단위로 조회합니다. page는 0부터 시작합니다.")
    @GetMapping("/me/liked/posts")
    public ApiResponse<PostListResponse> getLikedPosts(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Positive int size) {
        return ApiResponse.ok(userService.getLikedPosts(userDetails.getId(), page, size));
    }

    @Operation(summary = "회원 탈퇴", description = "탈퇴 즉시 로그인 불가. 게시글·댓글은 유지되며 작성자 정보는 익명 처리됩니다.")
    @DeleteMapping("/me")
    public ApiResponse<Void> withdraw(@AuthenticationPrincipal CustomUserDetails userDetails) {
        userService.withdraw(userDetails.getId());
        return ApiResponse.ok();
    }

    @Operation(summary = "선호도 수정", description = "기존 선호도를 수정합니다. 선호도가 등록되지 않은 경우 에러가 반환됩니다.")
    @PatchMapping("/preference")
    public ApiResponse<Void> updatePreference(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody UpdatePreferenceRequest request) {
        userService.updatePreference(userDetails.getId(), request);
        return ApiResponse.ok();
    }
}
