package com.breadbread.bakery.service;

import com.breadbread.bakery.dto.*;
import com.breadbread.bakery.entity.*;
import com.breadbread.bakery.repository.*;
import com.breadbread.global.exception.CustomException;
import com.breadbread.global.exception.ErrorCode;
import com.breadbread.global.service.GcsService;
import com.breadbread.user.entity.User;
import com.breadbread.user.entity.UserRole;
import com.breadbread.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

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
    public BakeryListResponse search(BakerySearch search, Pageable pageable, Long userId) {
        Page<Bakery> result = bakeryRepository.search(search, pageable);
        List<Bakery> bakeries = result.getContent();

        List<Long> ids = bakeries.stream().map(Bakery::getId).toList();
        Map<Long, String> thumbnailMap = bakeryImageRepository
                .findAllByBakeryIdInAndDisplayOrder(ids, 1)
                .stream()
                .collect(Collectors.toMap(img -> img.getBakery().getId(), BakeryImage::getImageUrl));
		Map<Long, Long> likeCountMap = bakeryLikeRepository
			.countByBakeryIdIn(ids)
			.stream()
			.collect(Collectors.toMap(row -> (Long) row[0], row -> (Long) row[1]));
		Set<Long> likeIds = userId != null
			? new HashSet<>(bakeryLikeRepository.findLikedBakeryIdsByUserId(ids, userId))
			: Collections.emptySet();

        return BakeryListResponse.builder()
                .bakeries(bakeries.stream()
                        .map(b -> BakerySummaryResponse.from(b, thumbnailMap.get(b.getId()),
								likeCountMap.getOrDefault(b.getId(), 0L), likeIds.contains(b.getId())))
                        .toList())
                .total((int) result.getTotalElements())
                .page(pageable.getPageNumber())
                .size(pageable.getPageSize())
                .hasNext(result.hasNext())
                .build();
    }

    @Transactional(readOnly = true)
    public BakeryDetailResponse findOne(Long bakeryId, Long userId) {
        Bakery bakery = bakeryRepository.findById(bakeryId)
                .orElseThrow(() -> new CustomException(ErrorCode.BAKERY_NOT_FOUND));
		Long likeCount = bakeryLikeRepository.countByBakery(bakery);
		boolean liked = userId != null && bakeryLikeRepository.existsByBakeryIdAndUserId(bakeryId, userId);
        return BakeryDetailResponse.from(bakery, likeCount, liked);
    }

    @Transactional
    public Long createBakery(Long userId, CreateBakeryRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        Bakery bakery = Bakery.builder()
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

        if (request.getImageUrls() != null) {
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
        log.info("빵집 수정: bakeryId={}, userId={}", bakeryId, userId);

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
        log.info("빵집 삭제: bakeryId={}, userId={}", bakeryId, userId);
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

        Long breadId = breadRepository.save(bread).getId();
        log.info("빵 등록: breadId={}, bakeryId={}, userId={}", breadId, bakeryId, userId);
        return breadId;
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
        log.info("빵 수정: breadId={}, bakeryId={}, userId={}", breadId, bakeryId, userId);
    }

    @Transactional
    public void deleteBread(Long userId, UserRole role, Long bakeryId, Long breadId) {
        Bakery bakery = bakeryRepository.findById(bakeryId)
                .orElseThrow(() -> new CustomException(ErrorCode.BAKERY_NOT_FOUND));

        checkAuthority(bakery, userId, role);

        Bread bread = breadRepository.findById(breadId)
                .orElseThrow(() -> new CustomException(ErrorCode.MENU_NOT_FOUND));

        log.info("빵 삭제: breadId={}, bakeryId={}, userId={}", breadId, bakeryId, userId);
        if (bread.getImageUrl() != null) {
            gcsService.deleteQuietly(bread.getImageUrl());
        }
        breadRepository.delete(bread);
    }

	@Transactional
	public void like(Long bakeryId, Long userId) {
		Bakery bakery = bakeryRepository.findById(bakeryId)
			.orElseThrow(() -> new CustomException(ErrorCode.BAKERY_NOT_FOUND));

		if (bakeryLikeRepository.existsByBakeryIdAndUserId(bakeryId, userId)) {
			throw new CustomException(ErrorCode.ALREADY_LIKED);
		}

		User user = userRepository.findById(userId)
			.orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

		try {
			bakeryLikeRepository.save(BakeryLike.builder()
				.bakery(bakery)
				.user(user)
				.build());
		} catch (DataIntegrityViolationException e) {
			throw new CustomException(ErrorCode.ALREADY_LIKED);
		}
	}


	@Transactional
	public void unlike(Long bakeryId, Long userId) {
		BakeryLike like = bakeryLikeRepository.findByBakeryIdAndUserId(bakeryId, userId).orElseThrow(
			() -> new CustomException(ErrorCode.NOT_LIKED)
		);
		bakeryLikeRepository.delete(like);
	}

	@Transactional
	public Long createReview(Long bakeryId, Long userId, CreateReviewRequest request){
		Bakery bakery = bakeryRepository.findById(bakeryId)
			.orElseThrow(() -> new CustomException(ErrorCode.BAKERY_NOT_FOUND));
		User user = userRepository.findById(userId)
			.orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

		Review review = Review.builder()
			.content(request.getContent())
			.rating(request.getRating())
			.imageUrls(request.getImageUrls())
			.bakery(bakery)
			.user(user)
			.build();
		reviewRepository.save(review);
		bakery.updateRating(reviewRepository.findAverageRatingByBakeryId(bakeryId).orElse(null));
		return review.getId();
	}

	@Transactional(readOnly = true)
	public ReviewListResponse getReviews(Long bakeryId, ReviewSortType sort, int page, int size) {
		if (!bakeryRepository.existsById(bakeryId)) {
			throw new CustomException(ErrorCode.BAKERY_NOT_FOUND);
		}
		Sort sorting = switch (sort) {
			case RATING_HIGH -> Sort.by("rating").descending();
			case RATING_LOW  -> Sort.by("rating").ascending();
			default          -> Sort.by("createdAt").descending();
		};
		Page<Review> result = reviewRepository.findAllByBakeryId(bakeryId, PageRequest.of(page, size, sorting));
		return ReviewListResponse.builder()
			.reviews(result.getContent().stream().map(ReviewResponse::from).toList())
			.total((int) result.getTotalElements())
			.page(page)
			.size(size)
			.hasNext(result.hasNext())
			.build();
	}

	@Transactional
	public void updateReview(Long bakeryId, Long reviewId, Long userId, UpdateReviewRequest request) {
		Bakery bakery = bakeryRepository.findById(bakeryId)
			.orElseThrow(() -> new CustomException(ErrorCode.BAKERY_NOT_FOUND));

		Review review = reviewRepository.findByIdAndBakeryId(reviewId, bakeryId)
			.orElseThrow(() -> new CustomException(ErrorCode.REVIEW_NOT_FOUND));

		if (!review.getUser().getId().equals(userId)) {
			throw new CustomException(ErrorCode.FORBIDDEN);
		}

		review.update(request);
		bakery.updateRating(reviewRepository.findAverageRatingByBakeryId(bakeryId).orElse(null));
		log.info("리뷰 수정: reviewId={}, bakeryId={}, userId={}", reviewId, bakeryId, userId);
	}

	@Transactional
	public void deleteReview(Long bakeryId, Long reviewId, Long userId, UserRole role) {
		Bakery bakery = bakeryRepository.findById(bakeryId)
			.orElseThrow(() -> new CustomException(ErrorCode.BAKERY_NOT_FOUND));

		Review review = reviewRepository.findByIdAndBakeryId(reviewId, bakeryId)
			.orElseThrow(() -> new CustomException(ErrorCode.REVIEW_NOT_FOUND));

		if (role != UserRole.ROLE_ADMIN && !review.getUser().getId().equals(userId)) {
			throw new CustomException(ErrorCode.FORBIDDEN);
		}

		reviewRepository.delete(review);
		bakery.updateRating(reviewRepository.findAverageRatingByBakeryId(bakeryId).orElse(null));
		log.info("리뷰 삭제: reviewId={}, bakeryId={}, userId={}", reviewId, bakeryId, userId);
	}

    private void checkAuthority(Bakery bakery, Long userId, UserRole role) {
        if (role == UserRole.ROLE_ADMIN) return;
        if (bakery.getOwner() == null || !bakery.getOwner().getId().equals(userId)) {
            log.warn("빵집 접근 권한 없음: bakeryId={}, userId={}", bakery.getId(), userId);
            throw new CustomException(ErrorCode.FORBIDDEN);
        }
    }
}
