package com.breadbread.auth.controller;

import com.breadbread.auth.dto.*;
import com.breadbread.auth.entity.SsoProvider;
import com.breadbread.auth.service.AuthService;
import com.breadbread.auth.dto.SignupRequest;
import com.breadbread.auth.dto.CheckIdResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
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

    @Operation(summary = "회원가입")
    @ApiResponse(responseCode = "201")
    @ResponseStatus(HttpStatus.CREATED)
    @PostMapping("/signup")
    public String signup(@Valid @RequestBody SignupRequest request) {
        return authService.signup(request);
    }

    @Operation(summary = "로그인")
    @ApiResponse(responseCode = "200", description = "accessToken, refreshToken 반환")
    @PostMapping("/login")
    public TokenResponse login(@Valid @RequestBody LoginRequest request){
        return authService.login(request);
    }

    @Operation(summary = "로그아웃")
    @ApiResponse(responseCode = "200")
    @PostMapping("/logout")
    public void logout(@RequestHeader("Authorization") String bearerToken) {
        String accessToken = bearerToken.substring(7);
        authService.logout(accessToken);
    }

    @Operation(summary = "토큰 갱신")
    @ApiResponse(responseCode = "200", description = "accessToken, refreshToken 반환")
    @PostMapping("/refresh")
    public TokenResponse refresh(@Valid @RequestBody TokenRequest request) {
        return authService.refresh(request.getRefreshToken());
    }

    @Operation(summary = "아이디 중복 확인")
    @ApiResponse(responseCode = "200", description = "중복 여부 반환")
    @GetMapping("/check-id")
    public CheckIdResponse checkId(@RequestParam String loginId) {
        return authService.checkId(loginId);
    }

    @Operation(summary = "아이디 찾기")
    @ApiResponse(responseCode = "200", description = "아이디 반환")
    @PostMapping("/find-id")
    public FindIdResponse findId(@Valid @RequestBody FindIdRequest request) {
        return authService.findId(request);
    }

    @Operation(summary = "비밀번호 찾기")
    @ApiResponse(responseCode = "200")
    @PostMapping("/find-pw")
    public void findPw(@Valid @RequestBody FindPwRequest request) {
        authService.findPassword(request);
    }

    @Operation(summary = "비밀번호 재설정")
    @ApiResponse(responseCode = "200")
    @PatchMapping("/reset-pw")
    public void resetPw(@Valid @RequestBody ResetPwRequest request) {
        authService.resetPassword(request);
    }

    @Operation(summary = "휴대전화 인증 요청")
    @ApiResponse(responseCode = "200")
    @PostMapping("/phone/send")
    public void sendPhone(@Valid @RequestBody SendPhoneRequest request) {
        authService.sendVerificationCode(request);
    }

    @Operation(summary = "휴대전화 인증 확인")
    @ApiResponse(responseCode = "200", description = "verificationToken 반환")
    @PostMapping("/phone/verify")
    public VerifyPhoneResponse verifyPhone(@Valid @RequestBody VerifyPhoneRequest request) {
        return authService.verifyCode(request);
    }

    @Operation(summary = "소셜 로그인")
    @ApiResponse(responseCode = "200", description = "accessToken, refreshToken 반환")
    @PostMapping("/social/{provider}")
    public TokenResponse socialLogin(@PathVariable SsoProvider provider,
                                     @RequestBody SocialLoginRequest request) {
        return authService.socialLogin(provider, request);
    }
}
