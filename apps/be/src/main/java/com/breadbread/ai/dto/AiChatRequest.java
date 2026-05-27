package com.breadbread.ai.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class AiChatRequest {

    @NotBlank(message = "메시지를 입력해주세요.")
    private String message;

    private Long courseId;

    private String conversationId;
}
