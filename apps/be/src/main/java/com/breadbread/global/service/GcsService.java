package com.breadbread.global.service;

import com.breadbread.global.exception.CustomException;
import com.breadbread.global.exception.ErrorCode;
import com.google.cloud.storage.BlobId;
import com.google.cloud.storage.BlobInfo;
import com.google.cloud.storage.Storage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class GcsService {

    private static final Set<String> ALLOWED_TYPES = Set.of("image/jpeg", "image/jpg", "image/png", "image/webp");

    private final Storage storage;

    @Value("${gcs.bucket}")
    private String bucketName;

    public String upload(MultipartFile file, String folder) {
        String originalFilename = Optional.ofNullable(file.getOriginalFilename())
                .filter(name -> !name.isBlank())
                .orElseThrow(() -> new CustomException(ErrorCode.INVALID_FILE_NAME));

        if (!ALLOWED_TYPES.contains(file.getContentType())) {
            log.warn("허용되지 않는 파일 타입: {}", file.getContentType());
            throw new CustomException(ErrorCode.INVALID_FILE_TYPE);
        }

        String fileName = folder + "/" + UUID.randomUUID() + "_" + originalFilename;

        BlobInfo blobInfo = BlobInfo.newBuilder(bucketName, fileName)
                .setContentType(file.getContentType())
                .build();

        try {
            storage.create(blobInfo, file.getBytes());
            log.info("GCS 파일 업로드 성공: {}", fileName);
        } catch (IOException e) {
            log.error("GCS 파일 업로드 실패: {}", fileName, e);
            throw new CustomException(ErrorCode.FILE_UPLOAD_FAILED);
        }

        return "https://storage.googleapis.com/" + bucketName + "/" + fileName;
    }

    public List<String> uploadAll(List<MultipartFile> files, String folder) {
        log.info("GCS 다중 파일 업로드 시작: {}개, folder={}", files.size(), folder);
        List<String> uploadedUrls = new ArrayList<>();

        for (MultipartFile file : files) {
            try {
                uploadedUrls.add(upload(file, folder));
            } catch (CustomException e) {
                log.warn("GCS 업로드 실패, 부분 성공 롤백: 업로드된 {}개 삭제", uploadedUrls.size());
                uploadedUrls.forEach(this::deleteQuietly);
                throw e;
            }
        }

        return uploadedUrls;
    }

    public void delete(String fileUrl) {
        String prefix = "https://storage.googleapis.com/" + bucketName + "/";
        if (!fileUrl.startsWith(prefix)) {
            log.warn("유효하지 않은 GCS URL: {}", fileUrl);
            throw new CustomException(ErrorCode.INVALID_GCS_URL);
        }

        String fileName = fileUrl.substring(prefix.length());

        try {
            storage.delete(BlobId.of(bucketName, fileName));
            log.info("GCS 파일 삭제 성공: {}", fileName);
        } catch (Exception e) {
            log.error("GCS 파일 삭제 실패: {}", fileName, e);
            throw new CustomException(ErrorCode.FILE_DELETE_FAILED);
        }
    }

    public void deleteQuietly(String url) {
        try {
            delete(url);
        } catch (Exception e) {
            log.warn("GCS 파일 삭제 실패 (무시됨): {}", url, e);
        }
    }
}