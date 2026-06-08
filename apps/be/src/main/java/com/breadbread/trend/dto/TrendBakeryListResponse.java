package com.breadbread.trend.dto;

import java.util.List;
import lombok.Builder;
import lombok.Getter;
import org.springframework.data.domain.Page;

@Getter
@Builder
public class TrendBakeryListResponse {

    private List<TrendBakeryResponse> bakeries;
    private int total;
    private int page;
    private int size;
    private boolean hasNext;

    public static TrendBakeryListResponse from(Page<TrendBakeryResponse> page) {
        return TrendBakeryListResponse.builder()
                .bakeries(page.getContent())
                .total((int) page.getTotalElements())
                .page(page.getNumber())
                .size(page.getSize())
                .hasNext(page.hasNext())
                .build();
    }
}
