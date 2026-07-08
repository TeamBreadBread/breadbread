package com.breadbread.bakery.service;

import com.breadbread.bakery.dto.request.BakeryAdminSearch;
import com.breadbread.bakery.dto.request.BakeryAiSearch;
import com.breadbread.bakery.dto.request.BakerySearch;
import com.breadbread.bakery.dto.request.CreateBakeryRequest;
import com.breadbread.bakery.dto.request.UpdateBakeryRequest;
import com.breadbread.bakery.dto.response.*;
import com.breadbread.bakery.entity.*;
import com.breadbread.bakery.entity.enums.AdminBakerySortType;
import com.breadbread.bakery.entity.enums.BakerySortType;
import com.breadbread.bakery.entity.enums.BakeryStatus;
import com.breadbread.bakery.entity.enums.BakeryTagType;
import com.breadbread.bakery.entity.enums.BreadTagType;
import com.breadbread.bakery.entity.enums.DayType;
import com.breadbread.bakery.event.BakeriesApprovedEvent;
import com.breadbread.bakery.repository.*;
import com.breadbread.bakery.service.BakeryImageService.PreviewBatch;
import com.breadbread.course.repository.CourseBakeryRepository;
import com.breadbread.course.repository.CourseDrivingRouteRepository;
import com.breadbread.global.exception.CustomException;
import com.breadbread.global.exception.ErrorCode;
import com.breadbread.user.entity.User;
import com.breadbread.user.entity.UserRole;
import com.breadbread.user.repository.UserRepository;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class BakeryService {
    private final BakeryRepository bakeryRepository;
    private final BreadRepository breadRepository;
    private final UserRepository userRepository;
    private final CrowdTimeRepository crowdTimeRepository;
    private final BakeryImageRepository bakeryImageRepository;
    private final BakeryLikeRepository bakeryLikeRepository;
    private final ReviewRepository reviewRepository;
    private final CourseBakeryRepository courseBakeryRepository;
    private final CourseDrivingRouteRepository courseDrivingRouteRepository;
    private final GooglePlacesUpdateService googlePlacesUpdateService;
    private final BakeryImageService bakeryImageService;
    private final ApplicationEventPublisher eventPublisher;
    private final BakeryTagRepository bakeryTagRepository;
    private final BreadTagRepository breadTagRepository;

    @Transactional(readOnly = true)
    public List<BakeryAiResponse> findAllForAi(BakeryAiSearch search) {
        List<Bakery> bakeries = bakeryRepository.searchForAi(search);
        List<Long> ids = bakeries.stream().map(Bakery::getId).toList();

        Map<Long, List<Bread>> breadMap =
                breadRepository.findAllByBakeryIdIn(ids).stream()
                        .collect(Collectors.groupingBy(b -> b.getBakery().getId()));

        Map<Long, List<CrowdTime>> crowdTimeMap =
                crowdTimeRepository.findAllByBakeryIdIn(ids).stream()
                        .collect(Collectors.groupingBy(ct -> ct.getBakery().getId()));

        DayType targetDayType = null;
        if (search.isOpen()) {
            LocalDate date =
                    search.getVisitDate() != null
                            ? search.getVisitDate()
                            : LocalDate.now(ZoneId.of("Asia/Seoul"));
            DayOfWeek dow = date.getDayOfWeek();
            targetDayType =
                    (dow == DayOfWeek.SATURDAY || dow == DayOfWeek.SUNDAY)
                            ? DayType.WEEKEND
                            : DayType.WEEKDAY;
        }

        final DayType dayTypeFilter = targetDayType;
        return bakeries.stream()
                .map(
                        b -> {
                            List<CrowdTime> crowdTimes =
                                    crowdTimeMap.getOrDefault(b.getId(), List.of());
                            if (dayTypeFilter != null) {
                                crowdTimes =
                                        crowdTimes.stream()
                                                .filter(ct -> ct.getDayType() == dayTypeFilter)
                                                .toList();
                            }
                            return BakeryAiResponse.from(
                                    b,
                                    breadMap.getOrDefault(b.getId(), List.of()),
                                    crowdTimes,
                                    dayTypeFilter);
                        })
                .toList();
    }

    @Transactional(readOnly = true)
    public BakeryAiResponse findOneForAi(Long id) {
        Bakery bakery =
                bakeryRepository
                        .findByIdAndActiveTrueAndStatus(id, BakeryStatus.APPROVED)
                        .orElseThrow(() -> new CustomException(ErrorCode.BAKERY_NOT_FOUND));
        List<Long> ids = List.of(id);
        List<Bread> breads = breadRepository.findAllByBakeryIdIn(ids);
        List<CrowdTime> crowdTimes = crowdTimeRepository.findAllByBakeryIdIn(ids);
        return BakeryAiResponse.from(bakery, breads, crowdTimes, null);
    }

    private void validateSearch(BakerySearch search) {
        boolean needsCoords =
                search.getSort() == BakerySortType.NEARBY || search.getRadiusMeters() != null;
        if (needsCoords && (search.getUserLat() == null || search.getUserLng() == null)) {
            throw new CustomException(ErrorCode.INVALID_INPUT_VALUE);
        }
    }

    @Transactional(readOnly = true)
    public BakeryListResponse search(BakerySearch search, Pageable pageable, Long userId) {
        validateSearch(search);
        Page<Bakery> result = bakeryRepository.search(search, pageable);
        List<Bakery> bakeries = result.getContent();

        List<Long> ids = bakeries.stream().map(Bakery::getId).toList();
        PreviewBatch previewBatch = bakeryImageService.resolvePreviewBatch(ids);
        Map<Long, List<String>> previewUrlsByBakery = previewBatch.previewUrls();
        Map<Long, Integer> remainingPreviewByBakery = previewBatch.remainingCounts();
        Map<Long, Long> likeCountMap =
                bakeryLikeRepository.countByBakeryIdIn(ids).stream()
                        .collect(Collectors.toMap(row -> (Long) row[0], row -> (Long) row[1]));
        Map<Long, Long> reviewCountMap =
                ids.isEmpty()
                        ? Collections.emptyMap()
                        : reviewRepository.countByBakeryIdInAndActiveTrue(ids).stream()
                                .collect(
                                        Collectors.toMap(
                                                row -> (Long) row[0], row -> (Long) row[1]));
        Map<Long, Double> avgRatingMap =
                ids.isEmpty()
                        ? Collections.emptyMap()
                        : reviewRepository.averageRatingByBakeryIdIn(ids).stream()
                                .collect(
                                        Collectors.toMap(
                                                row -> (Long) row[0], row -> (Double) row[1]));
        Set<Long> likeIds =
                userId != null
                        ? new HashSet<>(
                                bakeryLikeRepository.findLikedBakeryIdsByUserId(ids, userId))
                        : Collections.emptySet();

        return BakeryListResponse.builder()
                .bakeries(
                        bakeries.stream()
                                .map(
                                        b -> {
                                            List<String> previews =
                                                    previewUrlsByBakery.getOrDefault(
                                                            b.getId(), List.of());
                                            return BakerySummaryResponse.from(
                                                    b,
                                                    previews.isEmpty() ? null : previews.get(0),
                                                    likeCountMap.getOrDefault(b.getId(), 0L),
                                                    reviewCountMap.getOrDefault(b.getId(), 0L),
                                                    likeIds.contains(b.getId()),
                                                    previews,
                                                    remainingPreviewByBakery.getOrDefault(
                                                            b.getId(), 0),
                                                    avgRatingMap.getOrDefault(b.getId(), 0.0));
                                        })
                                .toList())
                .total((int) result.getTotalElements())
                .page(pageable.getPageNumber())
                .size(pageable.getPageSize())
                .hasNext(result.hasNext())
                .build();
    }

    @Transactional(readOnly = true)
    public BakerySimpleListResponse searchSimple(BakerySearch search, Pageable pageable) {
        validateSearch(search);
        Page<Bakery> result = bakeryRepository.search(search, pageable);
        List<Bakery> bakeries = result.getContent();
        List<Long> ids = bakeries.stream().map(Bakery::getId).toList();

        Map<Long, String> thumbnailByBakery = bakeryImageService.resolveThumbnails(ids);

        Map<Long, Double> avgRatingMap =
                ids.isEmpty()
                        ? Collections.emptyMap()
                        : reviewRepository.averageRatingByBakeryIdIn(ids).stream()
                                .collect(
                                        Collectors.toMap(
                                                row -> (Long) row[0], row -> (Double) row[1]));

        return BakerySimpleListResponse.builder()
                .bakeries(
                        bakeries.stream()
                                .map(
                                        b ->
                                                BakerySummarySimpleResponse.from(
                                                        b,
                                                        thumbnailByBakery.get(b.getId()),
                                                        avgRatingMap.getOrDefault(b.getId(), 0.0)))
                                .toList())
                .total((int) result.getTotalElements())
                .page(pageable.getPageNumber())
                .size(pageable.getPageSize())
                .hasNext(result.hasNext())
                .build();
    }

    @Transactional(readOnly = true)
    public BakeryDetailResponse findOne(Long bakeryId, Long userId) {
        Bakery bakery =
                bakeryRepository
                        .findByIdAndActiveTrueAndStatus(bakeryId, BakeryStatus.APPROVED)
                        .orElseThrow(() -> new CustomException(ErrorCode.BAKERY_NOT_FOUND));
        Long likeCount = bakeryLikeRepository.countByBakery(bakery);
        boolean liked =
                userId != null && bakeryLikeRepository.existsByBakeryIdAndUserId(bakeryId, userId);
        long reviewCount = reviewRepository.countByBakeryIdAndActiveTrue(bakeryId);
        double rating = reviewRepository.findAverageRatingByBakeryId(bakeryId).orElse(0.0);

        // 이미지가 없으면 Google Places에서 자동 동기화 후 신규 이미지 조회.
        // syncBakery는 REQUIRES_NEW 트랜잭션이므로 readOnly 컨텍스트에서도 write 가능.
        List<BakeryImage> images =
                bakery.getImages() != null ? bakery.getImages() : Collections.emptyList();
        if (images.isEmpty()) {
            try {
                googlePlacesUpdateService.syncBakery(bakeryId);
                images =
                        bakeryImageRepository.findAllByBakeryIdInOrderByDisplayOrderAsc(
                                List.of(bakeryId));
            } catch (Exception e) {
                log.warn("[자동 Places 동기화] 실패: bakeryId={}", bakeryId, e);
                images = Collections.emptyList();
            }
        }

        List<String> imageUrls = bakeryImageService.resolveDetailUrls(images);

        List<BakeryTagType> popularBakeryTags =
                bakeryTagRepository.findPopularTagsByBakeryId(bakeryId, 4);

        List<Long> breadIds =
                bakery.getBreads() == null
                        ? Collections.emptyList()
                        : bakery.getBreads().stream().map(Bread::getId).toList();
        Map<Long, List<BreadTagType>> breadPopularTags;
        if (breadIds.isEmpty()) {
            breadPopularTags = Collections.emptyMap();
        } else {
            breadPopularTags = new HashMap<>();
            breadTagRepository
                    .findPopularTagsByBreadIds(breadIds, 4)
                    .forEach(
                            row ->
                                    breadPopularTags
                                            .computeIfAbsent((Long) row[0], k -> new ArrayList<>())
                                            .add((BreadTagType) row[1]));
        }

        return BakeryDetailResponse.from(
                bakery,
                likeCount,
                liked,
                reviewCount,
                imageUrls,
                rating,
                popularBakeryTags,
                breadPopularTags);
    }

    @Transactional
    public Long createBakery(Long userId, CreateBakeryRequest request) {
        User user =
                userRepository
                        .findById(userId)
                        .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        if (user.getRole() != UserRole.ROLE_ADMIN && user.getRole() != UserRole.ROLE_BUSINESS) {
            throw new CustomException(ErrorCode.FORBIDDEN);
        }

        Bakery bakery =
                Bakery.builder()
                        .name(request.getName())
                        .address(request.getAddress())
                        .region(request.getRegion())
                        .latitude(request.getLat())
                        .longitude(request.getLng())
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
                        .estimatedStayMinutes(request.getEstimatedStayMinutes())
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
        log.info("빵집 생성: bakeryId={}, userId={}", saved.getId(), userId);

        bakeryImageService.saveImages(userId, saved, request.getImageUrls());

        return saved.getId();
    }

    @Transactional
    public void updateBakery(
            Long userId, UserRole role, Long bakeryId, UpdateBakeryRequest request) {
        Bakery bakery =
                bakeryRepository
                        .findByIdAndActiveTrue(bakeryId)
                        .orElseThrow(() -> new CustomException(ErrorCode.BAKERY_NOT_FOUND));
        checkAuthority(bakery, userId, role);

        boolean coordinatesChanged = request.getLat() != null || request.getLng() != null;

        bakery.update(request);
        log.info("빵집 수정: bakeryId={}, userId={}", bakeryId, userId);

        if (coordinatesChanged) {
            List<Long> courseIds = courseBakeryRepository.findCourseIdsByBakeryId(bakeryId);
            if (!courseIds.isEmpty()) {
                courseDrivingRouteRepository.deleteByIdCourseIdIn(courseIds);
                log.info("빵집 좌표 변경으로 경로 캐시 삭제: bakeryId={}, courseIds={}", bakeryId, courseIds);
            }
        }

        if (request.getImageUrls() != null) {
            bakeryImageService.replaceImages(userId, bakery, request.getImageUrls());
        }
    }

    @Transactional
    public void deleteBakery(Long userId, UserRole role, Long bakeryId) {
        Bakery bakery =
                bakeryRepository
                        .findByIdAndActiveTrue(bakeryId)
                        .orElseThrow(() -> new CustomException(ErrorCode.BAKERY_NOT_FOUND));

        checkAuthority(bakery, userId, role);
        log.info("빵집 삭제: bakeryId={}, userId={}", bakeryId, userId);
        bakeryImageService.deleteAllImages(bakery);
        bakery.deactivate();

        List<Long> courseIds = courseBakeryRepository.findCourseIdsByBakeryId(bakeryId);
        if (!courseIds.isEmpty()) {
            courseDrivingRouteRepository.deleteByIdCourseIdIn(courseIds);
            log.info("빵집 삭제로 경로 캐시 삭제: bakeryId={}, courseIds={}", bakeryId, courseIds);
        }
    }

    @Transactional
    public void like(Long bakeryId, Long userId) {
        Bakery bakery =
                bakeryRepository
                        .findByIdAndActiveTrueAndStatus(bakeryId, BakeryStatus.APPROVED)
                        .orElseThrow(() -> new CustomException(ErrorCode.BAKERY_NOT_FOUND));

        User user =
                userRepository
                        .findById(userId)
                        .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        try {
            bakeryLikeRepository.saveAndFlush(
                    BakeryLike.builder().bakery(bakery).user(user).build());
        } catch (DataIntegrityViolationException e) {
            log.warn(
                    "[빵집 좋아요 중복 또는 무결성 위반] bakeryId={}, userId={}, msg={}",
                    bakeryId,
                    userId,
                    e.getMessage());
            throw new CustomException(ErrorCode.ALREADY_LIKED);
        }
        log.info("빵집 좋아요: bakeryId={}, userId={}", bakeryId, userId);
    }

    @Transactional
    public void unlike(Long bakeryId, Long userId) {
        BakeryLike like =
                bakeryLikeRepository
                        .findByBakeryIdAndUserId(bakeryId, userId)
                        .orElseThrow(() -> new CustomException(ErrorCode.NOT_LIKED));
        bakeryLikeRepository.delete(like);
        log.info("빵집 좋아요 취소: bakeryId={}, userId={}", bakeryId, userId);
    }

    @Transactional(readOnly = true)
    public BakeryAdminListResponse getBakeriesByStatus(
            BakeryStatus status,
            boolean active,
            String keyword,
            AdminBakerySortType sort,
            Pageable pageable) {
        BakeryAdminSearch search =
                BakeryAdminSearch.builder()
                        .status(status)
                        .active(active)
                        .keyword(keyword)
                        .sort(sort)
                        .build();
        Page<Bakery> page = bakeryRepository.searchAdmin(search, pageable);

        List<Long> bakeryIds = page.getContent().stream().map(Bakery::getId).toList();
        Map<Long, List<Bread>> breadMap =
                breadRepository.findAllByBakeryIdIn(bakeryIds).stream()
                        .collect(Collectors.groupingBy(b -> b.getBakery().getId()));
        Map<Long, List<CrowdTime>> crowdTimeMap =
                crowdTimeRepository.findAllByBakeryIdIn(bakeryIds).stream()
                        .collect(Collectors.groupingBy(ct -> ct.getBakery().getId()));

        List<BakeryAdminResponse> bakeries =
                page.getContent().stream()
                        .map(
                                bakery ->
                                        BakeryAdminResponse.from(
                                                bakery,
                                                breadMap.getOrDefault(bakery.getId(), List.of()),
                                                crowdTimeMap.getOrDefault(
                                                        bakery.getId(), List.of())))
                        .toList();

        return BakeryAdminListResponse.builder()
                .bakeries(bakeries)
                .total((int) page.getTotalElements())
                .page(pageable.getPageNumber())
                .size(pageable.getPageSize())
                .hasNext(page.hasNext())
                .build();
    }

    @Transactional(readOnly = true)
    public BakeryAdminResponse getBakeryAdmin(Long bakeryId) {
        Bakery bakery =
                bakeryRepository
                        .findById(bakeryId)
                        .orElseThrow(() -> new CustomException(ErrorCode.BAKERY_NOT_FOUND));
        List<Bread> breads = breadRepository.findAllByBakeryIdIn(List.of(bakeryId));
        List<CrowdTime> crowdTimes = crowdTimeRepository.findAllByBakeryIdIn(List.of(bakeryId));
        return BakeryAdminResponse.from(bakery, breads, crowdTimes);
    }

    @Transactional
    public ApproveBakeriesResponse approveAllPendingBakeries(Long adminUserId) {
        List<Long> ids =
                bakeryRepository.findAllByActiveTrueAndStatus(BakeryStatus.PENDING).stream()
                        .map(Bakery::getId)
                        .toList();
        return approveBakeries(adminUserId, ids);
    }

    @Transactional
    public ApproveBakeriesResponse approveBakeries(Long adminUserId, List<Long> bakeryIds) {
        List<ApproveBakeriesResponse.SkippedBakery> skipped = new ArrayList<>();
        List<Long> approvedIds = new ArrayList<>();
        for (Long id : bakeryIds) {
            Bakery bakery =
                    bakeryRepository
                            .findByIdAndActiveTrue(id)
                            .orElseThrow(() -> new CustomException(ErrorCode.BAKERY_NOT_FOUND));
            if (bakery.getStatus() != BakeryStatus.PENDING
                    || bakery.getName() == null
                    || bakery.getAddress() == null
                    || bakery.getLatitude() == 0.0
                    || bakery.getLongitude() == 0.0
                    || bakery.getRegion() == null
                    || bakery.getDong() == null
                    || bakery.getBakeryType() == null
                    || bakery.getBusinessHours() == null
                    || !bakery.getBusinessHours().isComplete()) {
                skipped.add(
                        ApproveBakeriesResponse.SkippedBakery.builder()
                                .id(bakery.getId())
                                .name(bakery.getName())
                                .build());
                continue;
            }
            bakery.approve();
            approvedIds.add(id);
        }
        log.info("빵집 일괄 승인: 성공={}, 스킵={}", approvedIds.size(), skipped.size());

        if (!approvedIds.isEmpty()) {
            eventPublisher.publishEvent(new BakeriesApprovedEvent(adminUserId, approvedIds));
        }

        return ApproveBakeriesResponse.builder()
                .successCount(approvedIds.size())
                .skipCount(skipped.size())
                .skippedBakeries(skipped)
                .build();
    }

    @Transactional
    public void rejectBakery(Long bakeryId) {
        Bakery bakery =
                bakeryRepository
                        .findByIdAndActiveTrue(bakeryId)
                        .orElseThrow(() -> new CustomException(ErrorCode.BAKERY_NOT_FOUND));
        if (bakery.getStatus() != BakeryStatus.PENDING) {
            throw new CustomException(ErrorCode.BAKERY_NOT_PENDING);
        }
        bakery.reject();
        log.info("빵집 거절: bakeryId={}", bakeryId);
    }

    @Transactional
    public int hardDeleteByStatus(BakeryStatus status) {
        if (status == BakeryStatus.APPROVED) {
            throw new CustomException(ErrorCode.FORBIDDEN);
        }
        List<Bakery> active = bakeryRepository.findAllByActiveTrueAndStatus(status);
        List<Bakery> inactive = bakeryRepository.findAllByActiveFalseAndStatus(status);
        List<Bakery> targets = new ArrayList<>();
        targets.addAll(active);
        targets.addAll(inactive);
        targets.forEach(b -> deleteRelatedData(b.getId()));
        targets.forEach(bakeryImageService::deleteAllImages);
        bakeryRepository.deleteAll(targets);
        log.info("빵집 전체 영구삭제: status={}, count={}", status, targets.size());
        return targets.size();
    }

    @Transactional
    public void hardDeleteBakery(Long bakeryId) {
        Bakery bakery =
                bakeryRepository
                        .findById(bakeryId)
                        .orElseThrow(() -> new CustomException(ErrorCode.BAKERY_NOT_FOUND));
        if (bakery.getStatus() == BakeryStatus.APPROVED) {
            throw new CustomException(ErrorCode.FORBIDDEN);
        }
        deleteRelatedData(bakeryId);
        bakeryImageService.deleteAllImages(bakery);
        bakeryRepository.delete(bakery);
        log.info("빵집 영구삭제: bakeryId={}", bakeryId);
    }

    private void deleteRelatedData(Long bakeryId) {
        List<Long> courseIds = courseBakeryRepository.findCourseIdsByBakeryId(bakeryId);
        if (!courseIds.isEmpty()) {
            courseDrivingRouteRepository.deleteByIdCourseIdIn(courseIds);
        }
        courseBakeryRepository.deleteAllByBakeryId(bakeryId);
        breadRepository.deleteAllByBakeryId(bakeryId);
        crowdTimeRepository.deleteAllByBakeryId(bakeryId);
        reviewRepository.deleteAllByBakeryId(bakeryId);
        bakeryLikeRepository.deleteAllByBakeryId(bakeryId);
    }

    private void checkAuthority(Bakery bakery, Long userId, UserRole role) {
        if (role == UserRole.ROLE_ADMIN) return;
        if (bakery.getOwner() == null || !bakery.getOwner().getId().equals(userId)) {
            log.warn("빵집 접근 권한 없음: bakeryId={}, userId={}", bakery.getId(), userId);
            throw new CustomException(ErrorCode.FORBIDDEN);
        }
    }
}
