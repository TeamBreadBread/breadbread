package com.breadbread.bakery.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class CreateMenuReportRequest {

    @NotNull private Long bakeryId;

    @NotBlank
    @Size(max = 120)
    private String menuName;

    @Size(max = 500)
    private String description;
}
