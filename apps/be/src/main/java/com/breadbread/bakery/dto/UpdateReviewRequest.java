package com.breadbread.bakery.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class UpdateReviewRequest {

    @Min(1)
    @Max(5)
    private Integer rating;

    @Size(min = 1, max = 300)
    private String content;

    @Size(max = 2)
    private List<String> imageUrls;
}
