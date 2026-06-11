package com.breadbread.bakery.dto.request;

import com.breadbread.bakery.entity.enums.BakeryReportType;
import com.breadbread.bakery.entity.enums.BakeryUpdateField;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class CreateBakeryReportRequest {

    @NotNull private BakeryReportType type;

    // NEW_BAKERY
    private String bakeryName;
    private String address;
    private String district;
    private List<String> representativeMenus;
    private String recommendation;

    // UPDATE_BAKERY
    private String targetBakeryName;
    private BakeryUpdateField updateField;
    private String correctValue;
    private String description;
}
