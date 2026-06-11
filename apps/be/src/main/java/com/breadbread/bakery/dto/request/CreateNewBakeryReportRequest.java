package com.breadbread.bakery.dto.request;

import jakarta.validation.constraints.NotBlank;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class CreateNewBakeryReportRequest {

    @NotBlank private String bakeryName;
    private String address;
    private String district;
    private List<String> representativeMenus;
    private String recommendation;
}
