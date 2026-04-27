package com.breadbread.global.controller;

import com.breadbread.global.dto.ApiResponse;
import com.breadbread.global.service.GcsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.parameters.RequestBody;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;

import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Tag(name = "이미지")
@RestController
@RequestMapping("/api/images")
@RequiredArgsConstructor
public class ImageController {

    private final GcsService gcsService;

    @Operation(summary = "이미지 선업로드", description = "폼 제출 전 이미지를 미리 업로드하고 URL 목록을 반환. folder 예시: bakeries, breads, reviews")
    @RequestBody(content = @Content(mediaType = MediaType.MULTIPART_FORM_DATA_VALUE))
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<List<String>> upload(
            @RequestPart List<MultipartFile> images,
            @RequestParam(defaultValue = "common") String folder) {
        return ApiResponse.ok(gcsService.uploadAll(images, folder));
    }
}
