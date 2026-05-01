package com.breadbread.auth.controller;

import com.breadbread.auth.dto.*;
import com.breadbread.auth.entity.SsoProvider;
import com.breadbread.auth.service.AuthService;
import com.breadbread.global.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@Tag(name = "인증")
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @SecurityRequirements
    @Operation(summary = "회원가입")
    @ResponseStatus(HttpStatus.CREATED)
    @PostMapping("/signup")
    public ApiResponse<Void> signup(@Valid @RequestBody SignupRequest request) {
        authService.signup(request);
        return ApiResponse.ok();
    }

    @SecurityRequirements
    @Operation(summary = "로그인")
    @PostMapping("/login")
    public ApiResponse<TokenResponse> login(@Valid @RequestBody LoginRequest request) {
        return ApiResponse.ok(authService.login(request));
    }

    @Operation(summary = "로그아웃")
    @PostMapping("/logout")
    public ApiResponse<Void> logout(
            @Parameter(description = "Bearer {accessToken}") @RequestHeader("Authorization") String bearerToken) {
        String accessToken = bearerToken.substring(7);
        authService.logout(accessToken);
        return ApiResponse.ok();
    }

    @SecurityRequirements
    @Operation(summary = "토큰 갱신")
    @PostMapping("/refresh")
    public ApiResponse<TokenResponse> refresh(@Valid @RequestBody TokenRequest request) {
        return ApiResponse.ok(authService.refresh(request.getRefreshToken()));
    }

    @SecurityRequirements
    @Operation(summary = "아이디 중복 확인")
    @GetMapping("/check-id")
    public ApiResponse<CheckIdResponse> checkId(
            @Parameter(description = "중복 확인할 아이디", example = "breaduser123") @RequestParam String loginId) {
        return ApiResponse.ok(authService.checkId(loginId));
    }

    @SecurityRequirements
    @Operation(summary = "아이디 찾기")
    @PostMapping("/find-id")
    public ApiResponse<FindIdResponse> findId(@Valid @RequestBody FindIdRequest request) {
        return ApiResponse.ok(authService.findId(request));
    }

    @SecurityRequirements
    @Operation(summary = "비밀번호 찾기")
    @PostMapping("/find-pw")
    public ApiResponse<Void> findPw(@Valid @RequestBody FindPwRequest request) {
        authService.findPassword(request);
        return ApiResponse.ok();
    }

    @SecurityRequirements
    @Operation(summary = "비밀번호 재설정")
    @PatchMapping("/reset-pw")
    public ApiResponse<Void> resetPw(@Valid @RequestBody ResetPwRequest request) {
        authService.resetPassword(request);
        return ApiResponse.ok();
    }

    @SecurityRequirements
    @Operation(summary = "휴대전화 인증 요청")
    @PostMapping("/phone/send")
    public ApiResponse<Void> sendPhone(@Valid @RequestBody SendPhoneRequest request) {
        authService.sendVerificationCode(request);
        return ApiResponse.ok();
    }

    @SecurityRequirements
    @Operation(summary = "휴대전화 인증 확인")
    @PostMapping("/phone/verify")
    public ApiResponse<VerifyPhoneResponse> verifyPhone(@Valid @RequestBody VerifyPhoneRequest request) {
        return ApiResponse.ok(authService.verifyCode(request));
    }

    @SecurityRequirements
    @Operation(summary = "소셜 로그인")
    @PostMapping("/social/{provider}")
    public ApiResponse<TokenResponse> socialLogin(
            @Parameter(description = "소셜 로그인 제공자 (KAKAO, NAVER, GOOGLE)") @PathVariable SsoProvider provider,
            @RequestBody SocialLoginRequest request) {
        return ApiResponse.ok(authService.socialLogin(provider, request));
    }
}
