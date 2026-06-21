package com.breadbread.bakery.dto.request;

import com.breadbread.bakery.entity.enums.BreadTagType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class MenuTagRequest {

    @NotNull private Long breadId;

    @NotNull
    @Size(max = 2)
    private List<@NotNull BreadTagType> tags;
}
