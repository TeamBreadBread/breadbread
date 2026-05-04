package com.breadbread.user.controller;

import com.breadbread.auth.dto.CustomUserDetails;
import com.breadbread.global.dto.ApiResponse;
import com.breadbread.user.dto.CreatePreferenceRequest;
import com.breadbread.user.dto.UpdatePreferenceRequest;
import com.breadbread.user.dto.PreferenceResponse;
import com.breadbread.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Tag(name = "유저")
@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;

    @Operation(summary = "선호도 조사 등록")
    @ResponseStatus(HttpStatus.CREATED)
    @PostMapping("/preference")
    public ApiResponse<Void> savePreference(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody CreatePreferenceRequest request) {
        userService.savePreference(userDetails.getId(), request);
        return ApiResponse.ok();
    }

    @Operation(summary = "내 선호도 조회")
    @GetMapping("/preference")
    public ApiResponse<PreferenceResponse> getPreference(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ApiResponse.ok(userService.getPreference(userDetails.getId()));
    }

    @Operation(summary = "선호도 수정")
    @PatchMapping("/preference")
    public ApiResponse<Void> updatePreference(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody UpdatePreferenceRequest request) {
        userService.updatePreference(userDetails.getId(), request);
        return ApiResponse.ok();
    }
}
