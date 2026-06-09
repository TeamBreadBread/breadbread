package com.breadbread.bakery.service;

import com.breadbread.bakery.dto.CreateBreadRequest;
import com.breadbread.bakery.dto.UpdateBreadRequest;
import com.breadbread.bakery.entity.Bakery;
import com.breadbread.bakery.entity.Bread;
import com.breadbread.bakery.repository.BakeryRepository;
import com.breadbread.bakery.repository.BreadRepository;
import com.breadbread.global.exception.CustomException;
import com.breadbread.global.exception.ErrorCode;
import com.breadbread.global.service.GcsService;
import com.breadbread.user.entity.UserRole;
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

        if (request.getImageUrl() != null && bread.getImageUrl() != null) {
            gcsService.deleteQuietly(bread.getImageUrl());
        }
        bread.update(request);
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

    private void checkAuthority(Bakery bakery, Long userId, UserRole role) {
        if (role == UserRole.ROLE_ADMIN) return;
        if (bakery.getOwner() == null || !bakery.getOwner().getId().equals(userId)) {
            log.warn("빵집 접근 권한 없음: bakeryId={}, userId={}", bakery.getId(), userId);
            throw new CustomException(ErrorCode.FORBIDDEN);
        }
    }
}
