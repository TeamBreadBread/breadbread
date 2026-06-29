package com.breadbread.bakery.dto.request;

import com.breadbread.bakery.entity.enums.BreadType;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class ApproveMenuReportRequest {

    @NotNull private Integer price;
    private String imageUrl;
    @NotNull private BreadType breadType;
    private Boolean signature;
}
