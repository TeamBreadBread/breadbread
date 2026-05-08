package com.breadbread.bakery.dto;

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
}
