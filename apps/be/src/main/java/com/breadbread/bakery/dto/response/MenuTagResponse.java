package com.breadbread.bakery.dto.response;

import com.breadbread.bakery.entity.enums.BreadTagType;
import java.util.List;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class MenuTagResponse {
    private Long breadId;
    private String breadName;
    private List<BreadTagType> tags;
}
