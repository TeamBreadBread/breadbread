package com.breadbread.bakery.service;

import com.breadbread.bakery.dto.*;
import com.breadbread.bakery.entity.Bakery;
import com.breadbread.bakery.entity.BakeryImage;
import com.breadbread.bakery.entity.Bread;
import com.breadbread.bakery.entity.CrowdTime;
import com.breadbread.bakery.repository.BakeryImageRepository;
import com.breadbread.bakery.repository.BakeryRepository;
import com.breadbread.bakery.repository.BreadRepository;
import com.breadbread.bakery.repository.CrowdTimeRepository;
import com.breadbread.global.exception.CustomException;
import com.breadbread.global.exception.ErrorCode;
import com.breadbread.global.service.GcsService;
import com.breadbread.user.entity.User;
import com.breadbread.user.entity.UserRole;
import com.breadbread.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BakeryService {
    private final BakeryRepository bakeryRepository;
    private final BreadRepository breadRepository;
    private final UserRepository userRepository;
    private final CrowdTimeRepository crowdTimeRepository;
    private final BakeryImageRepository bakeryImageRepository;
    private final GcsService gcsService;

    @Transactional(readOnly = true)
    public List<BakeryAiResponse> findAllForAi() {
        List<Bakery> bakeries = bakeryRepository.findAll();
        List<Long> ids = bakeries.stream().map(Bakery::getId).toList();

        Map<Long, List<Bread>> breadMap = breadRepository.findAllByBakeryIdIn(ids)
                .stream().collect(Collectors.groupingBy(b -> b.getBakery().getId()));

        Map<Long, List<CrowdTime>> crowdTimeMap = crowdTimeRepository.findAllByBakeryIdIn(ids)
                .stream().collect(Collectors.groupingBy(ct -> ct.getBakery().getId()));

        return bakeries.stream()
                .map(b -> BakeryAiResponse.from(b,
                        breadMap.getOrDefault(b.getId(), List.of()),
                        crowdTimeMap.getOrDefault(b.getId(), List.of())))
                .toList();
    }

    @Transactional(readOnly = true)
    public BakeryListResponse search(BakerySearch search, Pageable pageable) {
        Page<Bakery> result = bakeryRepository.search(search, pageable);
        List<Bakery> bakeries = result.getContent();

        List<Long> ids = bakeries.stream().map(Bakery::getId).toList();
        Map<Long, String> thumbnailMap = bakeryImageRepository
                .findAllByBakeryIdInAndDisplayOrder(ids, 1)
                .stream()
                .collect(Collectors.toMap(img -> img.getBakery().getId(), BakeryImage::getImageUrl));

        return BakeryListResponse.builder()
                .bakeries(bakeries.stream()
                        .map(b -> BakerySummaryResponse.from(b, thumbnailMap.get(b.getId())))
                        .toList())
                .total((int) result.getTotalElements())
                .page(pageable.getPageNumber())
                .size(pageable.getPageSize())
                .hasNext(result.hasNext())
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
                .bakeryType(request.getBakeryType())
                .bakeryUseTypes(request.getBakeryUseTypes())
                .bakeryPersonalities(request.getBakeryPersonalities())
                .closedDays(request.getClosedDays())
                .crowdedDays(request.getCrowdedDays())
                .dineInAvailable(request.isDineInAvailable())
                .parkingAvailable(request.isParkingAvailable())
                .drinkAvailable(request.isDrinkAvailable())
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

        Bakery saved = bakeryRepository.save(bakery);

        if(request.getImageUrls()!=null){
            List<BakeryImage> images = new ArrayList<>();
            String[] urls = request.getImageUrls();
            for (int i = 0; i < urls.length; i++) {
                images.add(BakeryImage.builder()
                        .imageUrl(urls[i])
                        .displayOrder(i + 1)
                        .bakery(saved)
                        .build());
            }
            bakeryImageRepository.saveAll(images);
        }

        return saved.getId();
    }

    @Transactional
    public void updateBakery(Long userId, UserRole role, Long bakeryId, UpdateBakeryRequest request) {
        Bakery bakery = bakeryRepository.findById(bakeryId)
                .orElseThrow(() -> new CustomException(ErrorCode.BAKERY_NOT_FOUND));
        checkAuthority(bakery, userId, role);
        bakery.update(request);

        if (request.getImageUrls() != null) {
            bakery.getImages().forEach(img -> gcsService.deleteQuietly(img.getImageUrl()));
            bakeryImageRepository.deleteAllByBakery(bakery);
            List<BakeryImage> images = new ArrayList<>();
            String[] urls = request.getImageUrls();
            for (int i = 0; i < urls.length; i++) {
                images.add(BakeryImage.builder()
                        .imageUrl(urls[i])
                        .displayOrder(i + 1)
                        .bakery(bakery)
                        .build());
            }
            bakeryImageRepository.saveAll(images);
        }
    }

    @Transactional
    public void deleteBakery(Long userId, UserRole role, Long bakeryId) {
        Bakery bakery = bakeryRepository.findById(bakeryId)
                .orElseThrow(() -> new CustomException(ErrorCode.BAKERY_NOT_FOUND));

        checkAuthority(bakery, userId, role);
        bakery.getImages().forEach(img -> gcsService.deleteQuietly(img.getImageUrl()));
        bakeryImageRepository.deleteAllByBakery(bakery);
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

        if (request.getImageUrl() != null && bread.getImageUrl() != null) {
            gcsService.deleteQuietly(bread.getImageUrl());
        }
        bread.update(request);
    }

    @Transactional
    public void deleteBread(Long userId, UserRole role, Long bakeryId, Long breadId) {
        Bakery bakery = bakeryRepository.findById(bakeryId)
                .orElseThrow(() -> new CustomException(ErrorCode.BAKERY_NOT_FOUND));

        checkAuthority(bakery, userId, role);

        Bread bread = breadRepository.findById(breadId)
                .orElseThrow(() -> new CustomException(ErrorCode.MENU_NOT_FOUND));

        if (bread.getImageUrl() != null) {
            gcsService.deleteQuietly(bread.getImageUrl());
        }
        breadRepository.delete(bread);
    }

    private void checkAuthority(Bakery bakery, Long userId, UserRole role) {
        if (role == UserRole.ROLE_ADMIN) return;
        if (bakery.getOwner() == null || !bakery.getOwner().getId().equals(userId)) {
            throw new CustomException(ErrorCode.FORBIDDEN);
        }
    }
}
