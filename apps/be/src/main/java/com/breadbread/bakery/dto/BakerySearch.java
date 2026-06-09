package com.breadbread.bakery.dto;

import com.breadbread.bakery.entity.BakerySortType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BakerySearch {
    private String keyword;
    private BakerySortType sort;
    private boolean open;
    private String region;
    private String dong;
}
