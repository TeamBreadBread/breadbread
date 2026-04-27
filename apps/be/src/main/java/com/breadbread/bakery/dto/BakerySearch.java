package com.breadbread.bakery.dto;

import com.breadbread.bakery.entity.BakerySortType;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class BakerySearch {
    String keyword;
    BakerySortType sort;
    private boolean open;
    private String region;
}
