package com.breadbread.bakery.dto;

import com.breadbread.bakery.entity.BakeryUpdateField;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class CreateUpdateBakeryReportRequest {

    @NotBlank private String targetBakeryName;
    @NotNull private BakeryUpdateField updateField;
    @NotBlank private String correctValue;
    private String description;
}
