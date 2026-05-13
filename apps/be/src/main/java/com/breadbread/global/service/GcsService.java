package com.breadbread.global.service;

import com.breadbread.global.exception.CustomException;
import com.breadbread.global.exception.ErrorCode;
import com.google.cloud.storage.BlobId;
import com.google.cloud.storage.BlobInfo;
import com.google.cloud.storage.Storage;
import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@Service
@RequiredArgsConstructor
public class GcsService {

    private static final Set<String> ALLOWED_TYPES =
            Set.of("image/jpeg", "image/jpg", "image/png", "image/webp");

    /** {@link com.breadbread.global.dto.UploadFolder} 과 동일한 업로드 루트만 허용 */
    private static final Set<String> ALLOWED_OBJECT_PREFIXES =
            Set.of("bakeries", "breads", "reviews", "posts", "profiles");

    /** 업로드 시 생성하는 객체 키 형식만 삭제에 허용합니다. (CodeQL 경로/URL taint 완화) */
    private static final Pattern ALLOWED_OBJECT_KEY =
            Pattern.compile(
                    "^(bakeries|breads|reviews|posts|profiles)/[0-9a-fA-F-]{36}\\.(jpg|png|webp)$");

    private final Storage storage;

    @Value("${gcs.bucket}")
    private String bucketName;

    public String upload(MultipartFile file, String folder) {
        if (!ALLOWED_OBJECT_PREFIXES.contains(folder)) {
            log.warn("허용되지 않는 업로드 폴더: {}", folder);
            throw new CustomException(ErrorCode.INVALID_INPUT_VALUE);
        }

        String contentType = file.getContentType();
        if (!ALLOWED_TYPES.contains(contentType)) {
            log.warn("허용되지 않는 파일 타입: {}", contentType);
            throw new CustomException(ErrorCode.INVALID_FILE_TYPE);
        }

        // GCS 객체 키에는 클라이언트 파일명을 넣지 않음(경로·CodeQL taint 차단). 확장자만 MIME 기준으로 고정.
        String fileName = folder + "/" + UUID.randomUUID() + safeExtensionForImageType(contentType);
        if (!isAllowedObjectKey(fileName)) {
            throw new CustomException(ErrorCode.INTERNAL_SERVER_ERROR);
        }

        BlobInfo blobInfo =
                BlobInfo.newBuilder(bucketName, fileName).setContentType(contentType).build();

        try {
            storage.create(blobInfo, file.getBytes());
            log.info("GCS 파일 업로드 성공: {}", fileName);
        } catch (IOException e) {
            log.error("GCS 파일 업로드 실패: {}", fileName, e);
            throw new CustomException(ErrorCode.FILE_UPLOAD_FAILED);
        }

        return "https://storage.googleapis.com/" + bucketName + "/" + fileName;
    }

    static String safeExtensionForImageType(String contentType) {
        return switch (contentType) {
            case "image/jpeg", "image/jpg" -> ".jpg";
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            default ->
                    throw new IllegalStateException(
                            "Unexpected image content type: " + contentType);
        };
    }

    /** 클라이언트 파일명 검증용. 경로 세그먼트에 {@code .} / {@code ..} / 빈 조각이 있으면 거부합니다. */
    static String sanitizeClientFilename(String raw) {
        String normalized = raw.replace('\\', '/').strip();
        if (normalized.isEmpty()) {
            return "";
        }
        String[] segments = normalized.split("/", -1);
        for (String segment : segments) {
            String s = segment.strip();
            if (s.isEmpty() || ".".equals(s) || "..".equals(s)) {
                return "";
            }
        }
        String name = segments[segments.length - 1].strip();
        return name.isEmpty() ? "" : name;
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
        String fileName = parseVerifiedObjectKeyFromPublicUrl(fileUrl);

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

    /** 공개 GCS URL에서 객체 키만 추출합니다. 호스트·경로·키 형식을 모두 검증합니다. */
    private String parseVerifiedObjectKeyFromPublicUrl(String fileUrl) {
        final URI uri;
        try {
            uri = new URI(fileUrl);
        } catch (URISyntaxException e) {
            log.warn("GCS URL 파싱 실패: {}", fileUrl);
            throw new CustomException(ErrorCode.INVALID_GCS_URL);
        }

        if (!"https".equalsIgnoreCase(uri.getScheme())) {
            throw new CustomException(ErrorCode.INVALID_GCS_URL);
        }
        if (!"storage.googleapis.com".equalsIgnoreCase(uri.getHost())) {
            throw new CustomException(ErrorCode.INVALID_GCS_URL);
        }
        if (uri.getRawQuery() != null || uri.getRawFragment() != null) {
            throw new CustomException(ErrorCode.INVALID_GCS_URL);
        }

        String path = uri.getRawPath();
        if (path == null || !path.startsWith("/")) {
            throw new CustomException(ErrorCode.INVALID_GCS_URL);
        }

        String expectedPrefix = "/" + bucketName + "/";
        if (!path.startsWith(expectedPrefix)) {
            log.warn("GCS URL 버킷 경로 불일치: {}", fileUrl);
            throw new CustomException(ErrorCode.INVALID_GCS_URL);
        }

        String fileName = path.substring(expectedPrefix.length());
        if (!isAllowedObjectKey(fileName)) {
            log.warn("GCS 객체 키 형식 불일치: {}", fileName);
            throw new CustomException(ErrorCode.INVALID_GCS_URL);
        }
        return fileName;
    }

    static boolean isAllowedObjectKey(String objectKey) {
        return ALLOWED_OBJECT_KEY.matcher(objectKey).matches();
    }
}
