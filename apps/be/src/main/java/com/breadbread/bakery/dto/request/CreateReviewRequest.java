package com.breadbread.bakery.dto.request;

import com.breadbread.bakery.entity.enums.BakeryTagType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class CreateReviewRequest {

    @Min(1)
    @Max(5)
    private int rating;

    @Size(max = 300)
    @NotBlank
    private String content;

    @Size(max = 2)
    private List<String> imageUrls;

    @Size(max = 2)
    private List<@NotNull BakeryTagType> bakeryTags;

    @Size(max = 5)
    private List<@NotNull @Valid MenuTagRequest> menuTags;
}
