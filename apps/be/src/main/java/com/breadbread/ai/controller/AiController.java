package com.breadbread.ai.controller;

import com.breadbread.ai.dto.AiChatRequest;
import com.breadbread.ai.dto.AiChatResponse;
import com.breadbread.ai.service.AiChatService;
import com.breadbread.auth.dto.CustomUserDetails;
import com.breadbread.global.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Curator")
@RestController
@RequestMapping("/curator")
@RequiredArgsConstructor
public class AiController {

    private final AiChatService aiChatService;

    @Operation(summary = "AI 채팅", description = "사용자 메시지를 AI에 전달하고 응답을 반환합니다.")
    @PostMapping("/chat")
    public ApiResponse<AiChatResponse> chat(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody AiChatRequest request) {
        return ApiResponse.ok(aiChatService.chat(userDetails.getId(), request));
    }
}
