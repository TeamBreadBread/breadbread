package com.breadbread.bakery.service;

import com.breadbread.bakery.dto.request.CreateBreadRequest;
import com.breadbread.bakery.dto.request.UpdateBreadRequest;
import com.breadbread.bakery.entity.Bakery;
import com.breadbread.bakery.entity.Bread;
import com.breadbread.bakery.repository.BakeryRepository;
import com.breadbread.bakery.repository.BreadRepository;
import com.breadbread.global.dto.UploadFolder;
import com.breadbread.global.exception.CustomException;
import com.breadbread.global.exception.ErrorCode;
import com.breadbread.image.service.GcsService;
import com.breadbread.image.service.TempImageService;
import com.breadbread.user.entity.UserRole;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class BreadService {

    private final BakeryRepository bakeryRepository;
    private final BreadRepository breadRepository;
    private final GcsService gcsService;
    private final TempImageService tempImageService;

    @Transactional
    public Long createBread(Long userId, UserRole role, Long bakeryId, CreateBreadRequest request) {
        Bakery bakery =
                bakeryRepository
                        .findByIdAndActiveTrue(bakeryId)
                        .orElseThrow(() -> new CustomException(ErrorCode.BAKERY_NOT_FOUND));

        checkAuthority(bakery, userId, role);

        Bread bread =
                Bread.builder()
                        .name(request.getName())
                        .price(request.getPrice())
                        .imageUrl(request.getImageUrl())
                        .breadType(request.getBreadType())
                        .signature(request.isSignature())
                        .bakery(bakery)
                        .build();

        Long breadId = breadRepository.save(bread).getId();
        if (request.getImageUrl() != null) {
            tempImageService.consumeOwnedImages(
                    userId, List.of(request.getImageUrl()), UploadFolder.breads);
        }
        log.info("빵 등록: breadId={}, bakeryId={}, userId={}", breadId, bakeryId, userId);
        return breadId;
    }

    @Transactional
    public void updateBread(
            Long userId, UserRole role, Long bakeryId, Long breadId, UpdateBreadRequest request) {
        Bakery bakery =
                bakeryRepository
                        .findByIdAndActiveTrue(bakeryId)
                        .orElseThrow(() -> new CustomException(ErrorCode.BAKERY_NOT_FOUND));

        checkAuthority(bakery, userId, role);

        Bread bread =
                breadRepository
                        .findByIdAndBakeryId(breadId, bakeryId)
                        .orElseThrow(() -> new CustomException(ErrorCode.MENU_NOT_FOUND));

        String oldImageUrl = bread.getImageUrl();
        String newImageUrl = request.getImageUrl();

        if (newImageUrl != null && !newImageUrl.equals(oldImageUrl)) {
            tempImageService.consumeOwnedImages(userId, List.of(newImageUrl), UploadFolder.breads);
        }

        bread.update(request);

        if (newImageUrl != null && oldImageUrl != null && !newImageUrl.equals(oldImageUrl)) {
            gcsService.deleteQuietly(oldImageUrl);
        }

        log.info("빵 수정: breadId={}, bakeryId={}, userId={}", breadId, bakeryId, userId);
    }

    @Transactional
    public void deleteBread(Long userId, UserRole role, Long bakeryId, Long breadId) {
        Bakery bakery =
                bakeryRepository
                        .findByIdAndActiveTrue(bakeryId)
                        .orElseThrow(() -> new CustomException(ErrorCode.BAKERY_NOT_FOUND));

        checkAuthority(bakery, userId, role);

        Bread bread =
                breadRepository
                        .findByIdAndBakeryId(breadId, bakeryId)
                        .orElseThrow(() -> new CustomException(ErrorCode.MENU_NOT_FOUND));

        log.info("빵 삭제: breadId={}, bakeryId={}, userId={}", breadId, bakeryId, userId);
        if (bread.getImageUrl() != null) {
            gcsService.deleteQuietly(bread.getImageUrl());
        }
        breadRepository.delete(bread);
    }

    @Transactional
    public void updateSoldOut(
            Long userId, UserRole role, Long bakeryId, Long breadId, boolean soldOut) {
        Bakery bakery =
                bakeryRepository
                        .findByIdAndActiveTrue(bakeryId)
                        .orElseThrow(() -> new CustomException(ErrorCode.BAKERY_NOT_FOUND));

        checkAuthority(bakery, userId, role);

        Bread bread =
                breadRepository
                        .findByIdAndBakeryId(breadId, bakeryId)
                        .orElseThrow(() -> new CustomException(ErrorCode.MENU_NOT_FOUND));

        if (soldOut) {
            bread.markSoldOut();
        } else {
            bread.markAvailable();
        }

        log.info(
                "빵 품절 상태 변경: breadId={}, bakeryId={}, soldOut={}, userId={}",
                breadId,
                bakeryId,
                soldOut,
                userId);
    }

    private void checkAuthority(Bakery bakery, Long userId, UserRole role) {
        if (role == UserRole.ROLE_ADMIN) return;
        if (bakery.getOwner() == null || !bakery.getOwner().getId().equals(userId)) {
            log.warn("빵집 접근 권한 없음: bakeryId={}, userId={}", bakery.getId(), userId);
            throw new CustomException(ErrorCode.FORBIDDEN);
        }
    }
}
