package com.breadbread.bakery.service;

import com.breadbread.bakery.dto.request.CreateReviewRequest;
import com.breadbread.bakery.dto.request.MenuTagRequest;
import com.breadbread.bakery.dto.request.UpdateReviewRequest;
import com.breadbread.bakery.dto.response.MenuTagResponse;
import com.breadbread.bakery.dto.response.ReviewListResponse;
import com.breadbread.bakery.dto.response.ReviewResponse;
import com.breadbread.bakery.entity.Bakery;
import com.breadbread.bakery.entity.BakeryTag;
import com.breadbread.bakery.entity.Bread;
import com.breadbread.bakery.entity.BreadTag;
import com.breadbread.bakery.entity.Review;
import com.breadbread.bakery.entity.enums.BakeryStatus;
import com.breadbread.bakery.entity.enums.BakeryTagType;
import com.breadbread.bakery.entity.enums.BreadTagType;
import com.breadbread.bakery.entity.enums.ReviewSortType;
import com.breadbread.bakery.repository.BakeryRepository;
import com.breadbread.bakery.repository.BakeryTagRepository;
import com.breadbread.bakery.repository.BreadRepository;
import com.breadbread.bakery.repository.BreadTagRepository;
import com.breadbread.bakery.repository.ReviewRepository;
import com.breadbread.global.dto.UploadFolder;
import com.breadbread.global.exception.CustomException;
import com.breadbread.global.exception.ErrorCode;
import com.breadbread.image.service.GcsService;
import com.breadbread.image.service.TempImageService;
import com.breadbread.user.entity.User;
import com.breadbread.user.entity.UserRole;
import com.breadbread.user.repository.UserRepository;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReviewService {

    private final BakeryRepository bakeryRepository;
    private final BreadRepository breadRepository;
    private final UserRepository userRepository;
    private final ReviewRepository reviewRepository;
    private final BakeryTagRepository bakeryTagRepository;
    private final BreadTagRepository breadTagRepository;
    private final GcsService gcsService;
    private final TempImageService tempImageService;

    @Transactional
    public Long createReview(Long bakeryId, Long userId, CreateReviewRequest request) {
        Bakery bakery =
                bakeryRepository
                        .findByIdAndActiveTrueAndStatus(bakeryId, BakeryStatus.APPROVED)
                        .orElseThrow(() -> new CustomException(ErrorCode.BAKERY_NOT_FOUND));
        User user =
                userRepository
                        .findById(userId)
                        .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        Review review =
                Review.builder()
                        .content(request.getContent())
                        .rating(request.getRating())
                        .imageUrls(request.getImageUrls())
                        .bakery(bakery)
                        .user(user)
                        .build();
        reviewRepository.save(review);

        if (request.getBakeryTags() != null) {
            bakeryTagRepository.saveAll(
                    request.getBakeryTags().stream()
                            .distinct()
                            .map(
                                    tag ->
                                            BakeryTag.builder()
                                                    .bakery(bakery)
                                                    .tag(tag)
                                                    .sourceType("REVIEW")
                                                    .sourceId(review.getId())
                                                    .build())
                            .toList());
        }

        if (request.getMenuTags() != null) {
            // 같은 breadId가 여러 번 올 경우 tags를 합쳐서 처리
            Map<Long, List<BreadTagType>> tagsByBreadId =
                    request.getMenuTags().stream()
                            .collect(
                                    Collectors.groupingBy(
                                            MenuTagRequest::getBreadId,
                                            Collectors.flatMapping(
                                                    m -> m.getTags().stream(),
                                                    Collectors.toList())));

            List<BreadTag> breadTagsToSave = new ArrayList<>();
            for (var entry : tagsByBreadId.entrySet()) {
                List<BreadTagType> dedupedTags = entry.getValue().stream().distinct().toList();
                if (dedupedTags.size() > 2) {
                    throw new CustomException(ErrorCode.MENU_TAG_LIMIT_EXCEEDED);
                }
                Bread bread =
                        breadRepository
                                .findByIdAndBakeryId(entry.getKey(), bakeryId)
                                .orElseThrow(() -> new CustomException(ErrorCode.MENU_NOT_FOUND));
                dedupedTags.stream()
                        .map(tag -> BreadTag.builder().bread(bread).tag(tag).review(review).build())
                        .forEach(breadTagsToSave::add);
            }
            breadTagRepository.saveAll(breadTagsToSave);
        }

        tempImageService.consumeOwnedImages(userId, request.getImageUrls(), UploadFolder.reviews);
        bakery.updateRating(reviewRepository.findAverageRatingByBakeryId(bakeryId).orElse(null));
        log.info(
                "리뷰 작성: reviewId={}, bakeryId={}, userId={}, bakeryTags={}, menuTagCount={}",
                review.getId(),
                bakeryId,
                userId,
                request.getBakeryTags(),
                request.getMenuTags() != null ? request.getMenuTags().size() : 0);
        return review.getId();
    }

    @Transactional(readOnly = true)
    public ReviewListResponse getReviews(
            Long bakeryId, ReviewSortType sort, int page, int size, Long userId) {
        if (!bakeryRepository.existsByIdAndActiveTrueAndStatus(bakeryId, BakeryStatus.APPROVED)) {
            throw new CustomException(ErrorCode.BAKERY_NOT_FOUND);
        }
        Sort sorting =
                switch (sort) {
                    case RATING_HIGH -> Sort.by("rating").descending();
                    case RATING_LOW -> Sort.by("rating").ascending();
                    default -> Sort.by("createdAt").descending();
                };
        Page<Review> result =
                reviewRepository.findAllByBakeryIdAndActiveTrue(
                        bakeryId, PageRequest.of(page, size, sorting));

        List<Long> reviewIds = result.getContent().stream().map(Review::getId).toList();
        Map<Long, List<BakeryTagType>> bakeryTagsByReviewId =
                bakeryTagRepository.findAllBySourceTypeAndSourceIdIn("REVIEW", reviewIds).stream()
                        .collect(
                                Collectors.groupingBy(
                                        BakeryTag::getSourceId,
                                        Collectors.mapping(
                                                BakeryTag::getTag, Collectors.toList())));

        List<BreadTag> allBreadTags = breadTagRepository.findAllByReviewIdIn(reviewIds);
        List<Long> breadIds =
                allBreadTags.stream().map(bt -> bt.getBread().getId()).distinct().toList();
        Map<Long, String> breadNameById =
                breadRepository.findAllById(breadIds).stream()
                        .collect(Collectors.toMap(b -> b.getId(), b -> b.getName()));
        Map<Long, List<BreadTag>> breadTagsByReviewId =
                allBreadTags.stream().collect(Collectors.groupingBy(bt -> bt.getReview().getId()));

        return ReviewListResponse.builder()
                .reviews(
                        result.getContent().stream()
                                .map(
                                        r -> {
                                            List<BakeryTagType> bakeryTags =
                                                    bakeryTagsByReviewId.getOrDefault(
                                                            r.getId(), List.of());
                                            List<MenuTagResponse> menuTags =
                                                    toMenuTagResponses(
                                                            breadTagsByReviewId.getOrDefault(
                                                                    r.getId(), List.of()),
                                                            breadNameById);
                                            return ReviewResponse.from(
                                                    r,
                                                    userId,
                                                    new ReviewResponse.TagBundle(
                                                            bakeryTags, menuTags));
                                        })
                                .toList())
                .total((int) result.getTotalElements())
                .page(page)
                .size(size)
                .hasNext(result.hasNext())
                .build();
    }

    @Transactional
    public void updateReview(
            Long bakeryId, Long reviewId, Long userId, UpdateReviewRequest request) {
        Bakery bakery =
                bakeryRepository
                        .findByIdAndActiveTrueAndStatus(bakeryId, BakeryStatus.APPROVED)
                        .orElseThrow(() -> new CustomException(ErrorCode.BAKERY_NOT_FOUND));

        Review review =
                reviewRepository
                        .findByIdAndBakeryIdAndActiveTrue(reviewId, bakeryId)
                        .orElseThrow(() -> new CustomException(ErrorCode.REVIEW_NOT_FOUND));

        if (!review.getUser().getId().equals(userId)) {
            throw new CustomException(ErrorCode.FORBIDDEN);
        }

        List<String> previousImageUrls = List.copyOf(review.getImageUrls());
        if (request.getImageUrls() != null) {
            List<String> addedImageUrls =
                    request.getImageUrls().stream()
                            .filter(url -> !previousImageUrls.contains(url))
                            .toList();
            tempImageService.consumeOwnedImages(userId, addedImageUrls, UploadFolder.reviews);
        }
        review.update(request);
        if (request.getImageUrls() != null) {
            previousImageUrls.stream()
                    .filter(url -> !request.getImageUrls().contains(url))
                    .forEach(gcsService::deleteQuietly);
        }

        if (request.getBakeryTags() != null) {
            syncBakeryTags(bakery, reviewId, request.getBakeryTags());
        }
        if (request.getMenuTags() != null) {
            syncMenuTags(bakeryId, reviewId, review, request.getMenuTags());
        }

        bakery.updateRating(reviewRepository.findAverageRatingByBakeryId(bakeryId).orElse(null));
        log.info(
                "리뷰 수정: reviewId={}, bakeryId={}, userId={}, bakeryTags={}, menuTagCount={}",
                reviewId,
                bakeryId,
                userId,
                request.getBakeryTags(),
                request.getMenuTags() != null ? request.getMenuTags().size() : 0);
    }

    @Transactional
    public void deleteReview(Long bakeryId, Long reviewId, Long userId, UserRole role) {
        Bakery bakery =
                bakeryRepository
                        .findByIdAndActiveTrueAndStatus(bakeryId, BakeryStatus.APPROVED)
                        .orElseThrow(() -> new CustomException(ErrorCode.BAKERY_NOT_FOUND));

        Review review =
                reviewRepository
                        .findByIdAndBakeryIdAndActiveTrue(reviewId, bakeryId)
                        .orElseThrow(() -> new CustomException(ErrorCode.REVIEW_NOT_FOUND));

        if (role != UserRole.ROLE_ADMIN && !review.getUser().getId().equals(userId)) {
            throw new CustomException(ErrorCode.FORBIDDEN);
        }

        review.getImageUrls().forEach(gcsService::deleteQuietly);
        bakeryTagRepository.deleteAll(
                bakeryTagRepository.findAllBySourceTypeAndSourceId("REVIEW", reviewId));
        breadTagRepository.deleteAll(breadTagRepository.findAllByReviewId(reviewId));
        review.deactivate();
        bakery.updateRating(reviewRepository.findAverageRatingByBakeryId(bakeryId).orElse(null));
        log.info("리뷰 삭제: reviewId={}, bakeryId={}, userId={}", reviewId, bakeryId, userId);
    }

    private void syncBakeryTags(Bakery bakery, Long reviewId, List<BakeryTagType> requested) {
        List<BakeryTag> existing =
                bakeryTagRepository.findAllBySourceTypeAndSourceId("REVIEW", reviewId);
        List<BakeryTagType> existingTypes = existing.stream().map(BakeryTag::getTag).toList();

        List<BakeryTagType> toAdd =
                requested.stream().distinct().filter(t -> !existingTypes.contains(t)).toList();
        List<BakeryTag> toRemove =
                existing.stream().filter(t -> !requested.contains(t.getTag())).toList();

        bakeryTagRepository.deleteAll(toRemove);
        bakeryTagRepository.saveAll(
                toAdd.stream()
                        .map(
                                tag ->
                                        BakeryTag.builder()
                                                .bakery(bakery)
                                                .tag(tag)
                                                .sourceType("REVIEW")
                                                .sourceId(reviewId)
                                                .build())
                        .toList());
    }

    private void syncMenuTags(
            Long bakeryId, Long reviewId, Review review, List<MenuTagRequest> requested) {
        List<BreadTag> existing = breadTagRepository.findAllByReviewId(reviewId);

        Map<Long, List<BreadTag>> existingByBreadId =
                existing.stream().collect(Collectors.groupingBy(bt -> bt.getBread().getId()));
        Map<Long, List<BreadTagType>> requestedByBreadId =
                requested.stream()
                        .collect(
                                Collectors.groupingBy(
                                        MenuTagRequest::getBreadId,
                                        Collectors.flatMapping(
                                                m -> m.getTags().stream(), Collectors.toList())))
                        .entrySet()
                        .stream()
                        .collect(
                                Collectors.toMap(
                                        Map.Entry::getKey,
                                        e -> {
                                            List<BreadTagType> deduped =
                                                    e.getValue().stream().distinct().toList();
                                            if (deduped.size() > 2) {
                                                throw new CustomException(
                                                        ErrorCode.MENU_TAG_LIMIT_EXCEEDED);
                                            }
                                            return deduped;
                                        }));

        // 요청에 없는 빵의 태그 전체 삭제
        existingByBreadId.forEach(
                (breadId, tags) -> {
                    if (!requestedByBreadId.containsKey(breadId)) {
                        breadTagRepository.deleteAll(tags);
                    }
                });

        // 요청된 빵별로 diff 처리
        List<BreadTag> breadTagsToSave = new ArrayList<>();
        for (var entry : requestedByBreadId.entrySet()) {
            Long breadId = entry.getKey();
            List<BreadTagType> requestedTags = entry.getValue();
            Bread bread =
                    breadRepository
                            .findByIdAndBakeryId(breadId, bakeryId)
                            .orElseThrow(() -> new CustomException(ErrorCode.MENU_NOT_FOUND));
            List<BreadTag> existingTags = existingByBreadId.getOrDefault(breadId, List.of());
            List<BreadTagType> existingTypes = existingTags.stream().map(BreadTag::getTag).toList();

            List<BreadTag> toRemove =
                    existingTags.stream().filter(t -> !requestedTags.contains(t.getTag())).toList();
            breadTagRepository.deleteAll(toRemove);

            requestedTags.stream()
                    .filter(t -> !existingTypes.contains(t))
                    .map(tag -> BreadTag.builder().bread(bread).tag(tag).review(review).build())
                    .forEach(breadTagsToSave::add);
        }
        breadTagRepository.saveAll(breadTagsToSave);
    }

    private List<MenuTagResponse> toMenuTagResponses(
            List<BreadTag> breadTags, Map<Long, String> breadNameById) {
        Map<Long, List<BreadTagType>> tagsByBreadId =
                breadTags.stream()
                        .collect(
                                Collectors.groupingBy(
                                        bt -> bt.getBread().getId(),
                                        Collectors.mapping(BreadTag::getTag, Collectors.toList())));
        return tagsByBreadId.entrySet().stream()
                .map(
                        e ->
                                MenuTagResponse.builder()
                                        .breadId(e.getKey())
                                        .breadName(breadNameById.get(e.getKey()))
                                        .tags(e.getValue())
                                        .build())
                .toList();
    }
}
