package com.breadbread.bakery.dto.request;

import com.breadbread.bakery.entity.enums.AdminBakerySortType;
import com.breadbread.bakery.entity.enums.BakeryStatus;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class BakeryAdminSearch {
    private BakeryStatus status;
    private Boolean active;
    private String keyword;

    @Builder.Default private AdminBakerySortType sort = AdminBakerySortType.CREATED_AT_DESC;
}
