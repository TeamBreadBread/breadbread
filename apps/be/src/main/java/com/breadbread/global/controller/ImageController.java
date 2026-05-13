package com.breadbread.global.controller;

import com.breadbread.global.dto.ApiResponse;
import com.breadbread.global.dto.UploadFolder;
import com.breadbread.global.service.GcsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.parameters.RequestBody;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@Tag(name = "이미지")
@RestController
@RequestMapping("/images")
@RequiredArgsConstructor
public class ImageController {

    private final GcsService gcsService;

    @Operation(
            summary = "이미지 선업로드",
            description =
                    "폼 제출 전 이미지를 미리 업로드하고 URL 목록을 반환. folder: bakeries, breads, reviews, posts, profiles")
    @RequestBody(content = @Content(mediaType = MediaType.MULTIPART_FORM_DATA_VALUE))
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<List<String>> upload(
            @RequestPart List<MultipartFile> images, @RequestParam UploadFolder folder) {
        log.info("이미지 업로드 요청: {}개, folder={}", images.size(), folder);
        return ApiResponse.ok(gcsService.uploadAll(images, folder.path()));
    }
}
