package com.breadbread.notification.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class CuratorNotificationRequest {

    @NotNull private Long userId;

    @NotNull private Long bakeryId;

    private Long courseId;

    @NotBlank private String title;

    @NotBlank private String message;
}
