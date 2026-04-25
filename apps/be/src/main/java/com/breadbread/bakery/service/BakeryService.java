package com.breadbread.bakery.service;

import com.breadbread.bakery.dto.*;
import com.breadbread.bakery.entity.Bakery;
import com.breadbread.bakery.entity.Bread;
import com.breadbread.bakery.repository.BakeryRepository;
import com.breadbread.bakery.repository.BreadRepository;
import com.breadbread.global.exception.CustomException;
import com.breadbread.global.exception.ErrorCode;
import com.breadbread.user.entity.User;
import com.breadbread.user.entity.UserRole;
import com.breadbread.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class BakeryService {

    private final BakeryRepository bakeryRepository;
    private final BreadRepository breadRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public BakeryListResponse findAll() {
        return BakeryListResponse.builder()
                .bakeries(bakeryRepository.findAll().stream()
                        .map(BakerySummaryResponse::from)
                        .toList())
                .total((int) bakeryRepository.count())
                .build();
    }

    @Transactional(readOnly = true)
    public BakeryDetailResponse findOne(Long bakeryId) {
        Bakery bakery = bakeryRepository.findById(bakeryId)
                .orElseThrow(() -> new CustomException(ErrorCode.BAKERY_NOT_FOUND));
        return BakeryDetailResponse.from(bakery);
    }

    @Transactional
    public Long createBakery(Long userId, CreateBakeryRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        Bakery bakery = Bakery.builder()
                .name(request.getName())
                .address(request.getAddress())
                .region(request.getRegion())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .phone(request.getPhone())
                .mapLink(request.getMapLink())
                .note(request.getNote())
                .bakeryUseTypes(request.getBakeryUseTypes())
                .bakeryPersonalities(request.getBakeryPersonalities())
                .closedDays(request.getClosedDays())
                .crowdedDays(request.getCrowdedDays())
                .dineInAvailable(request.isDineInAvailable())
                .parkingAvailable(request.isParkingAvailable())
                .appearanceTime(request.getAppearanceTime())
                .frequency(request.getFrequency())
                .weekdayOpen(request.getWeekdayOpen())
                .weekdayClose(request.getWeekdayClose())
                .weekendOpen(request.getWeekendOpen())
                .weekendClose(request.getWeekendClose())
                .lastOrderTime(request.getLastOrderTime())
                .holidayClosed(request.isHolidayClosed())
                .build();

        if (user.getRole() == UserRole.ROLE_BUSINESS) {
            bakery.assignOwner(user);
        }
        return bakeryRepository.save(bakery).getId();
    }

    @Transactional
    public void updateBakery(Long userId, UserRole role, Long bakeryId, UpdateBakeryRequest request) {
        Bakery bakery = bakeryRepository.findById(bakeryId)
                .orElseThrow(() -> new CustomException(ErrorCode.BAKERY_NOT_FOUND));

        checkAuthority(bakery, userId, role);

        bakery.update(request);
    }

    @Transactional
    public void deleteBakery(Long userId, UserRole role, Long bakeryId) {
        Bakery bakery = bakeryRepository.findById(bakeryId)
                .orElseThrow(() -> new CustomException(ErrorCode.BAKERY_NOT_FOUND));

        checkAuthority(bakery, userId, role);
        bakeryRepository.delete(bakery);
    }

    @Transactional
    public Long createBread(Long userId, UserRole role, Long bakeryId, CreateBreadRequest request) {
        Bakery bakery = bakeryRepository.findById(bakeryId)
                .orElseThrow(() -> new CustomException(ErrorCode.BAKERY_NOT_FOUND));

        checkAuthority(bakery, userId, role);

        Bread bread = Bread.builder()
                .name(request.getName())
                .price(request.getPrice())
                .imageUrl(request.getImageUrl())
                .breadType(request.getBreadType())
                .signature(request.isSignature())
                .bakery(bakery)
                .build();

        return breadRepository.save(bread).getId();
    }

    @Transactional
    public void updateBread(Long userId, UserRole role, Long bakeryId, Long breadId, UpdateBreadRequest request) {
        Bakery bakery = bakeryRepository.findById(bakeryId)
                .orElseThrow(() -> new CustomException(ErrorCode.BAKERY_NOT_FOUND));

        checkAuthority(bakery, userId, role);

        Bread bread = breadRepository.findById(breadId)
                .orElseThrow(() -> new CustomException(ErrorCode.MENU_NOT_FOUND));

        bread.update(request.getName(), request.getPrice(), request.getImageUrl(),
                request.getBreadType(), request.getSignature());
    }

    @Transactional
    public void deleteBread(Long userId, UserRole role, Long bakeryId, Long breadId) {
        Bakery bakery = bakeryRepository.findById(bakeryId)
                .orElseThrow(() -> new CustomException(ErrorCode.BAKERY_NOT_FOUND));

        checkAuthority(bakery, userId, role);

        Bread bread = breadRepository.findById(breadId)
                .orElseThrow(() -> new CustomException(ErrorCode.MENU_NOT_FOUND));

        breadRepository.delete(bread);
    }

    private void checkAuthority(Bakery bakery, Long userId, UserRole role) {
        if (role == UserRole.ROLE_ADMIN) return;
        if (bakery.getOwner() == null || !bakery.getOwner().getId().equals(userId)) {
            throw new CustomException(ErrorCode.FORBIDDEN);
        }
    }
}
