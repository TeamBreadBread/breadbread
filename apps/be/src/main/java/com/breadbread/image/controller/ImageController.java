package com.breadbread.image.controller;

import com.breadbread.auth.dto.CustomUserDetails;
import com.breadbread.global.dto.ApiResponse;
import com.breadbread.global.dto.UploadFolder;
import com.breadbread.image.service.GcsService;
import com.breadbread.image.service.TempImageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.parameters.RequestBody;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@Tag(name = "이미지")
@RestController
@RequestMapping("/images")
@RequiredArgsConstructor
public class ImageController {

    private final GcsService gcsService;
    private final TempImageService tempImageService;

    @Operation(
            summary = "이미지 선업로드",
            description =
                    "폼 제출 전 이미지를 미리 업로드하고 URL 목록을 반환. folder: bakeries, breads, reviews, posts, profiles")
    @RequestBody(content = @Content(mediaType = MediaType.MULTIPART_FORM_DATA_VALUE))
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<List<String>> upload(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestPart List<MultipartFile> images,
            @RequestParam UploadFolder folder) {
        log.info("이미지 업로드 요청: count={}, folder={}", images.size(), folder);
        List<String> uploadedUrls = gcsService.uploadAll(images, folder.path());
        try {
            tempImageService.saveAll(userDetails.getId(), uploadedUrls, folder);
        } catch (RuntimeException e) {
            uploadedUrls.forEach(gcsService::deleteQuietly);
            throw e;
        }
        return ApiResponse.ok(uploadedUrls);
    }

    @Operation(summary = "임시 이미지 삭제", description = "사용자가 소유한 임시 이미지를 삭제합니다.")
    @DeleteMapping
    public ApiResponse<Void> delete(
            @AuthenticationPrincipal CustomUserDetails userDetails, @RequestParam String url) {
        tempImageService.deleteOwnedImage(userDetails.getId(), userDetails.getRole(), url);
        return ApiResponse.ok();
    }
}
