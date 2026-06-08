package com.breadbread.trend.dto;

import java.util.List;
import lombok.Builder;
import lombok.Getter;
import org.springframework.data.domain.Page;

@Getter
@Builder
public class TrendBreadListResponse {

    private List<TrendBreadResponse> breads;
    private int total;
    private int page;
    private int size;
    private boolean hasNext;

    public static TrendBreadListResponse from(Page<TrendBreadResponse> page) {
        return TrendBreadListResponse.builder()
                .breads(page.getContent())
                .total((int) page.getTotalElements())
                .page(page.getNumber())
                .size(page.getSize())
                .hasNext(page.hasNext())
                .build();
    }
}
