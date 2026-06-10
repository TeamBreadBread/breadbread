package com.breadbread.image.service;

import com.breadbread.global.dto.UploadFolder;
import com.breadbread.global.exception.CustomException;
import com.breadbread.global.exception.ErrorCode;
import com.breadbread.image.entity.TempImage;
import com.breadbread.image.repository.TempImageRepository;
import com.breadbread.user.entity.User;
import com.breadbread.user.entity.UserRole;
import com.breadbread.user.repository.UserRepository;
import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class TempImageService {

    private final TempImageRepository tempImageRepository;
    private final UserRepository userRepository;
    private final GcsService gcsService;

    @Transactional
    public void saveAll(Long userId, List<String> urls, UploadFolder domain) {
        if (urls == null || urls.isEmpty()) {
            return;
        }

        User user =
                userRepository
                        .findById(userId)
                        .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        List<TempImage> tempImages =
                urls.stream()
                        .map(
                                url ->
                                        TempImage.builder()
                                                .url(url)
                                                .objectKey(gcsService.extractObjectKey(url))
                                                .domain(domain)
                                                .user(user)
                                                .build())
                        .toList();
        tempImageRepository.saveAll(tempImages);
        log.info("임시 이미지 저장 완료: userId={}, domain={}, count={}", userId, domain, urls.size());
    }

    @Transactional
    public void consumeOwnedImages(Long userId, List<String> urls, UploadFolder domain) {
        if (urls == null || urls.isEmpty()) {
            return;
        }

        Set<String> requestedUrls =
                urls.stream()
                        .filter(Objects::nonNull)
                        .collect(Collectors.toCollection(LinkedHashSet::new));
        if (requestedUrls.isEmpty()) {
            return;
        }

        List<TempImage> tempImages = tempImageRepository.findAllByUrlIn(requestedUrls);
        validateAllRequestedImagesExist(requestedUrls, tempImages);
        validateOwnershipAndDomain(userId, domain, tempImages);
        if (!tempImages.isEmpty()) {
            tempImageRepository.deleteAll(tempImages);
            log.info(
                    "임시 이미지 확정 완료: userId={}, domain={}, count={}",
                    userId,
                    domain,
                    tempImages.size());
        }
    }

    @Transactional
    public void deleteOwnedImage(Long userId, UserRole role, String url) {
        TempImage tempImage =
                tempImageRepository
                        .findByUrl(url)
                        .orElseThrow(() -> new CustomException(ErrorCode.TEMP_IMAGE_NOT_FOUND));

        if (role != UserRole.ROLE_ADMIN && !tempImage.getUser().getId().equals(userId)) {
            throw new CustomException(ErrorCode.FORBIDDEN);
        }

        gcsService.deleteByObjectKey(tempImage.getObjectKey());
        tempImageRepository.delete(tempImage);
        log.info("임시 이미지 삭제 완료: userId={}, tempImageId={}", userId, tempImage.getId());
    }

    @Transactional
    public void cleanupExpiredImages(LocalDateTime threshold) {
        List<TempImage> expiredImages = tempImageRepository.findAllByUploadedAtBefore(threshold);
        if (expiredImages.isEmpty()) {
            return;
        }

        int deletedCount = 0;
        for (TempImage expiredImage : expiredImages) {
            try {
                gcsService.deleteByObjectKey(expiredImage.getObjectKey());
                tempImageRepository.delete(expiredImage);
                deletedCount++;
            } catch (CustomException e) {
                log.warn(
                        "만료 임시 이미지 삭제 실패: tempImageId={}, url={}",
                        expiredImage.getId(),
                        expiredImage.getUrl(),
                        e);
            }
        }
        log.info("만료 임시 이미지 정리 완료: threshold={}, deletedCount={}", threshold, deletedCount);
    }

    private void validateAllRequestedImagesExist(
            Set<String> requestedUrls, List<TempImage> tempImages) {
        Set<String> foundUrls =
                tempImages.stream().map(TempImage::getUrl).collect(Collectors.toSet());
        if (foundUrls.size() != requestedUrls.size() || !foundUrls.containsAll(requestedUrls)) {
            throw new CustomException(ErrorCode.TEMP_IMAGE_NOT_FOUND);
        }
    }

    private void validateOwnershipAndDomain(
            Long userId, UploadFolder domain, List<TempImage> tempImages) {
        boolean hasInvalidImage =
                tempImages.stream()
                        .anyMatch(
                                tempImage ->
                                        !tempImage.getUser().getId().equals(userId)
                                                || tempImage.getDomain() != domain);
        if (hasInvalidImage) {
            throw new CustomException(ErrorCode.FORBIDDEN);
        }
    }
}
