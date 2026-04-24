package com.breadbread.user.controller;

import com.breadbread.auth.dto.CustomUserDetails;
import com.breadbread.global.dto.ApiResponse;
import com.breadbread.user.dto.SavePreferenceRequest;
import com.breadbread.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "유저")
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;

    @Operation(summary = "선호도 조사")
    @PostMapping("/preference")
    public ApiResponse<Void> savePreference(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody SavePreferenceRequest request) {
        userService.savePreference(userDetails.getId(), request);
        return ApiResponse.ok();
    }


}
