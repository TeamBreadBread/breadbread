package com.breadbread.auth.controller;

import com.breadbread.auth.dto.*;
import com.breadbread.auth.entity.SsoProvider;
import com.breadbread.auth.service.AuthService;
import com.breadbread.auth.dto.SignupRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
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
    public String signup(@RequestBody SignupRequest request) {
        return authService.signup(request);
    }

    @Operation(summary = "로그인")
    @ApiResponse(responseCode = "200", description = "accessToken, refreshToken 반환")
    @PostMapping("/login")
    public TokenResponse login(@RequestBody LoginRequest request){
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
    public TokenResponse refresh(@RequestBody TokenRequest request) {
        return authService.refresh(request.getRefreshToken());
    }

    @Operation(summary = "휴대전화 인증 요청")
    @ApiResponse(responseCode = "200")
    @PostMapping("/phone/send")
    public void sendPhone(@RequestBody SendPhoneRequest request) {
        authService.sendVerificationCode(request);
    }

    @Operation(summary = "휴대전화 인증 확인")
    @ApiResponse(responseCode = "200", description = "verificationToken 반환")
    @PostMapping("/phone/verify")
    public String verifyPhone(@RequestBody VerifyPhoneRequest request) {
        return authService.verifyCode(request);
    }

    @Operation(summary = "소셜 로그인")
    @ApiResponse(responseCode = "200", description = "accessToken, refreshToken 반환")
    @PostMapping("/{provider}")
    public TokenResponse socialLogin(@PathVariable SsoProvider provider,
                                     @RequestBody SocialLoginRequest request) {
        return authService.socialLogin(provider, request);
    }
}
