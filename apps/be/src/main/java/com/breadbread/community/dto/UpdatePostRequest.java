package com.breadbread.community.dto;

import jakarta.validation.constraints.Size;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class UpdatePostRequest {
    @Size(max = 100)
    private String title;

    @Size(max = 5000)
    private String content;

    @Size(max = 5)
    private List<String> imageUrls;
}
