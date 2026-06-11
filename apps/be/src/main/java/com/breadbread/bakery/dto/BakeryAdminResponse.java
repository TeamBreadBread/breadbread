package com.breadbread.bakery.dto;

import com.breadbread.bakery.entity.Bakery;
import com.breadbread.bakery.entity.BakeryStatus;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class BakeryAdminResponse {

    private Long id;
    private String name;
    private String address;
    private String dong;
    private Double latitude;
    private Double longitude;
    private String phone;
    private BakeryStatus status;

    public static BakeryAdminResponse from(Bakery bakery) {
        return BakeryAdminResponse.builder()
                .id(bakery.getId())
                .name(bakery.getName())
                .address(bakery.getAddress())
                .dong(bakery.getDong())
                .latitude(bakery.getLatitude() == 0.0 ? null : bakery.getLatitude())
                .longitude(bakery.getLongitude() == 0.0 ? null : bakery.getLongitude())
                .phone(bakery.getPhone())
                .status(bakery.getStatus())
                .build();
    }
}
