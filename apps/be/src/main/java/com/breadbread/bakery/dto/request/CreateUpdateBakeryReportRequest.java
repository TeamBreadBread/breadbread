package com.breadbread.bakery.dto.request;

import com.breadbread.bakery.entity.enums.BakeryUpdateField;
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
