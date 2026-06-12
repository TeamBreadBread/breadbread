package com.breadbread.congestion.dto;

import java.util.List;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class BakeryCongestionSignalAdminListResponse {
    private List<BakeryCongestionSignalAdminResponse> signals;
    private int total;
    private int page;
    private int size;
    private boolean hasNext;
}
