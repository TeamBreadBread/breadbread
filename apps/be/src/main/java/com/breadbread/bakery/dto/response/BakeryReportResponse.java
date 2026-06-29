package com.breadbread.bakery.dto.response;

import com.breadbread.bakery.entity.BakeryReport;
import com.breadbread.bakery.entity.enums.BakeryReportType;
import com.breadbread.bakery.entity.enums.BakeryStatus;
import com.breadbread.bakery.entity.enums.BakeryUpdateField;
import java.time.LocalDateTime;
import java.util.List;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class BakeryReportResponse {

    private Long id;
    private BakeryReportType type;
    private BakeryStatus status;
    private Long userId;
    private LocalDateTime createdAt;

    // NEW_BAKERY
    private String bakeryName;
    private String address;
    private String district;
    private List<String> representativeMenus;
    private String recommendation;

    // UPDATE_BAKERY
    private Long targetBakeryId;
    private BakeryUpdateField updateField;
    private String correctValue;
    private String description;

    // MENU_SUGGESTION
    private String menuName;
    private String menuDescription;

    public static BakeryReportResponse from(BakeryReport report) {
        return BakeryReportResponse.builder()
                .id(report.getId())
                .type(report.getType())
                .status(report.getStatus())
                .userId(report.getUser() != null ? report.getUser().getId() : null)
                .createdAt(report.getCreatedAt())
                .bakeryName(report.getBakeryName())
                .address(report.getAddress())
                .district(report.getDistrict())
                .representativeMenus(report.getRepresentativeMenus())
                .recommendation(report.getRecommendation())
                .targetBakeryId(report.getTargetBakeryId())
                .updateField(report.getUpdateField())
                .correctValue(report.getCorrectValue())
                .description(report.getDescription())
                .menuName(report.getMenuName())
                .menuDescription(report.getMenuDescription())
                .build();
    }
}
