package com.breadbread.bakery.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.breadbread.bakery.dto.BakerySearch;
import com.breadbread.bakery.dto.CreateBakeryRequest;
import com.breadbread.bakery.dto.CreateBreadRequest;
import com.breadbread.bakery.dto.CreateReviewRequest;
import com.breadbread.bakery.dto.UpdateBakeryRequest;
import com.breadbread.bakery.dto.UpdateBreadRequest;
import com.breadbread.bakery.dto.UpdateReviewRequest;
import com.breadbread.bakery.entity.Bakery;
import com.breadbread.bakery.entity.BakeryImage;
import com.breadbread.bakery.entity.BakeryLike;
import com.breadbread.bakery.entity.Bread;
import com.breadbread.bakery.entity.BreadType;
import com.breadbread.bakery.entity.CrowdLevel;
import com.breadbread.bakery.entity.CrowdTime;
import com.breadbread.bakery.entity.DayType;
import com.breadbread.bakery.entity.Review;
import com.breadbread.bakery.entity.ReviewSortType;
import com.breadbread.bakery.repository.BakeryImageRepository;
import com.breadbread.bakery.repository.BakeryLikeRepository;
import com.breadbread.bakery.repository.BakeryRepository;
import com.breadbread.bakery.repository.BreadRepository;
import com.breadbread.bakery.repository.CrowdTimeRepository;
import com.breadbread.bakery.repository.ReviewRepository;
import com.breadbread.global.exception.CustomException;
import com.breadbread.global.exception.ErrorCode;
import com.breadbread.global.service.GcsService;
import com.breadbread.user.entity.User;
import com.breadbread.user.entity.UserRole;
import com.breadbread.user.repository.UserRepository;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class BakeryServiceTest {

    @Mock private BakeryRepository bakeryRepository;
    @Mock private BreadRepository breadRepository;
    @Mock private UserRepository userRepository;
    @Mock private CrowdTimeRepository crowdTimeRepository;
    @Mock private BakeryImageRepository bakeryImageRepository;
    @Mock private BakeryLikeRepository bakeryLikeRepository;
    @Mock private ReviewRepository reviewRepository;
    @Mock private GcsService gcsService;

    @InjectMocks private BakeryService bakeryService;

    @Test
    void findAllForAi_groups_breads_and_crowd_times_when_data_present() {
        Bakery b = bakeryWithId(1L);
        Bread bread =
                Bread.builder()
                        .name("크루아상")
                        .price(3000)
                        .imageUrl(null)
                        .bakery(b)
                        .breadType(BreadType.BREAD)
                        .signature(false)
                        .selloutMin(0)
                        .build();
        CrowdTime crowd =
                CrowdTime.builder()
                        .dayType(DayType.WEEKDAY)
                        .crowdLevel(CrowdLevel.LOW)
                        .peakStart(null)
                        .peakEnd(null)
                        .expectedWaitMin(null)
                        .sourceType("test")
                        .bakery(b)
                        .build();

        when(bakeryRepository.findAll()).thenReturn(List.of(b));
        when(breadRepository.findAllByBakeryIdIn(List.of(1L))).thenReturn(List.of(bread));
        when(crowdTimeRepository.findAllByBakeryIdIn(List.of(1L))).thenReturn(List.of(crowd));

        var responses = bakeryService.findAllForAi();

        assertThat(responses).hasSize(1);
        assertThat(responses.get(0).getId()).isEqualTo(1L);
        assertThat(responses.get(0).getBreads()).hasSize(1);
        assertThat(responses.get(0).getCrowdTimes()).hasSize(1);
    }

    @Test
    void search_maps_thumbnail_preview_when_no_gallery_images() {
        Bakery b = bakeryWithId(10L);
        Pageable pageable = PageRequest.of(0, 5);
        when(bakeryRepository.search(any(BakerySearch.class), eq(pageable)))
                .thenReturn(new PageImpl<>(List.of(b), pageable, 1));
        BakeryImage thumb =
                BakeryImage.builder().imageUrl("thumb.jpg").displayOrder(1).bakery(b).build();
        when(bakeryImageRepository.findAllByBakeryIdInAndDisplayOrder(List.of(10L), 1))
                .thenReturn(List.of(thumb));
        when(bakeryImageRepository.findAllByBakeryIdInOrderByDisplayOrderAsc(List.of(10L)))
                .thenReturn(List.of());
        when(bakeryLikeRepository.countByBakeryIdIn(List.of(10L)))
                .thenReturn(Collections.singletonList(new Object[] {10L, 7L}));
        when(bakeryLikeRepository.findLikedBakeryIdsByUserId(List.of(10L), 5L))
                .thenReturn(List.of(10L));

        var result = bakeryService.search(BakerySearch.builder().build(), pageable, 5L);

        assertThat(result.getTotal()).isEqualTo(1);
        assertThat(result.getBakeries().get(0).getThumbnailUrl()).isEqualTo("thumb.jpg");
        assertThat(result.getBakeries().get(0).getPreviewImageUrls()).containsExactly("thumb.jpg");
        assertThat(result.getBakeries().get(0).getRemainingPreviewImageCount()).isZero();
        assertThat(result.getBakeries().get(0).getLikeCount()).isEqualTo(7L);
        assertThat(result.getBakeries().get(0).isLiked()).isTrue();
    }

    @Test
    void search_splits_preview_and_remaining_when_gallery_present() {
        Bakery b = bakeryWithId(2L);
        Pageable pageable = PageRequest.of(0, 10);
        when(bakeryRepository.search(any(BakerySearch.class), eq(pageable)))
                .thenReturn(new PageImpl<>(List.of(b), pageable, 1));
        when(bakeryImageRepository.findAllByBakeryIdInAndDisplayOrder(List.of(2L), 1))
                .thenReturn(List.of());
        List<BakeryImage> gallery = new ArrayList<>();
        for (int i = 1; i <= 6; i++) {
            gallery.add(BakeryImage.builder().imageUrl("u" + i).displayOrder(i).bakery(b).build());
        }
        when(bakeryImageRepository.findAllByBakeryIdInOrderByDisplayOrderAsc(List.of(2L)))
                .thenReturn(gallery);
        when(bakeryLikeRepository.countByBakeryIdIn(List.of(2L))).thenReturn(List.of());

        var result = bakeryService.search(BakerySearch.builder().build(), pageable, null);

        assertThat(result.getBakeries().get(0).getPreviewImageUrls())
                .containsExactly("u1", "u2", "u3", "u4");
        assertThat(result.getBakeries().get(0).getRemainingPreviewImageCount()).isEqualTo(2);
    }

    @Test
    void findOne_throws_whenMissing() {
        when(bakeryRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> bakeryService.findOne(1L, null))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.BAKERY_NOT_FOUND);
    }

    @Test
    void findOne_setsLiked_whenUserPresent() {
        Bakery b = bakeryWithId(3L);
        when(bakeryRepository.findById(3L)).thenReturn(Optional.of(b));
        when(bakeryLikeRepository.countByBakery(b)).thenReturn(4L);
        when(bakeryLikeRepository.existsByBakeryIdAndUserId(3L, 9L)).thenReturn(true);

        var detail = bakeryService.findOne(3L, 9L);

        assertThat(detail.getLikeCount()).isEqualTo(4L);
        assertThat(detail.isLiked()).isTrue();
    }

    @Test
    void createBakery_throws_whenUserMissing() {
        CreateBakeryRequest request = minimalCreateBakeryRequest();
        when(userRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> bakeryService.createBakery(1L, request))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.USER_NOT_FOUND);
    }

    @Test
    void createBakery_assignsOwner_andSavesImages_whenBusinessUser() {
        User user = user(10L, UserRole.ROLE_BUSINESS);
        CreateBakeryRequest request = minimalCreateBakeryRequest();
        ReflectionTestUtils.setField(request, "imageUrls", new String[] {"a.jpg", "b.jpg"});
        when(userRepository.findById(10L)).thenReturn(Optional.of(user));
        when(bakeryRepository.save(any(Bakery.class)))
                .thenAnswer(
                        inv -> {
                            Bakery saved = inv.getArgument(0);
                            ReflectionTestUtils.setField(saved, "id", 100L);
                            return saved;
                        });

        Long id = bakeryService.createBakery(10L, request);

        assertThat(id).isEqualTo(100L);
        ArgumentCaptor<List<BakeryImage>> captor = ArgumentCaptor.forClass(List.class);
        verify(bakeryImageRepository).saveAll(captor.capture());
        assertThat(captor.getValue()).hasSize(2);
        assertThat(captor.getValue().get(0).getDisplayOrder()).isEqualTo(1);
        assertThat(captor.getValue().get(1).getDisplayOrder()).isEqualTo(2);
        verify(bakeryRepository).save(any(Bakery.class));
    }

    @Test
    void createBakery_doesNotAssignOwner_whenRegularUser() {
        User user = user(11L, UserRole.ROLE_USER);
        CreateBakeryRequest request = minimalCreateBakeryRequest();
        when(userRepository.findById(11L)).thenReturn(Optional.of(user));
        when(bakeryRepository.save(any(Bakery.class)))
                .thenAnswer(
                        inv -> {
                            Bakery saved = inv.getArgument(0);
                            ReflectionTestUtils.setField(saved, "id", 101L);
                            return saved;
                        });

        bakeryService.createBakery(11L, request);

        ArgumentCaptor<Bakery> captor = ArgumentCaptor.forClass(Bakery.class);
        verify(bakeryRepository).save(captor.capture());
        assertThat(captor.getValue().getOwner()).isNull();
    }

    @Test
    void updateBakery_throws_whenForbidden() {
        Bakery bakery = bakeryWithId(1L);
        User owner = user(2L, UserRole.ROLE_BUSINESS);
        bakery.assignOwner(owner);
        when(bakeryRepository.findById(1L)).thenReturn(Optional.of(bakery));

        assertThatThrownBy(
                        () ->
                                bakeryService.updateBakery(
                                        99L, UserRole.ROLE_USER, 1L, new UpdateBakeryRequest()))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.FORBIDDEN);

        verify(bakeryImageRepository, never()).deleteAllByBakery(any());
    }

    @Test
    void updateBakery_replaces_images_when_admin_updates() {
        Bakery bakery = bakeryWithId(5L);
        bakery.getImages()
                .add(
                        BakeryImage.builder()
                                .imageUrl("old.jpg")
                                .displayOrder(1)
                                .bakery(bakery)
                                .build());
        UpdateBakeryRequest request = new UpdateBakeryRequest();
        ReflectionTestUtils.setField(request, "imageUrls", new String[] {"new.jpg"});
        when(bakeryRepository.findById(5L)).thenReturn(Optional.of(bakery));

        bakeryService.updateBakery(999L, UserRole.ROLE_ADMIN, 5L, request);

        verify(gcsService).deleteQuietly("old.jpg");
        verify(bakeryImageRepository).deleteAllByBakery(bakery);
        ArgumentCaptor<List<BakeryImage>> captor = ArgumentCaptor.forClass(List.class);
        verify(bakeryImageRepository).saveAll(captor.capture());
        assertThat(captor.getValue().get(0).getImageUrl()).isEqualTo("new.jpg");
    }

    @Test
    void updateBakery_skipsImageReplacement_whenImageUrlsIsNull() {
        Bakery bakery = bakeryWithId(12L);
        bakery.assignOwner(user(50L, UserRole.ROLE_BUSINESS));
        bakery.getImages()
                .add(
                        BakeryImage.builder()
                                .imageUrl("keep.jpg")
                                .displayOrder(1)
                                .bakery(bakery)
                                .build());
        UpdateBakeryRequest request = new UpdateBakeryRequest();
        ReflectionTestUtils.setField(request, "name", "이름만변경");
        when(bakeryRepository.findById(12L)).thenReturn(Optional.of(bakery));

        bakeryService.updateBakery(50L, UserRole.ROLE_BUSINESS, 12L, request);

        assertThat(bakery.getName()).isEqualTo("이름만변경");
        verify(gcsService, never()).deleteQuietly(any());
        verify(bakeryImageRepository, never()).deleteAllByBakery(any());
        verify(bakeryImageRepository, never()).saveAll(any());
    }

    @Test
    void deleteBakery_deletes_images_when_owner_deletes() {
        Bakery bakery = bakeryWithId(8L);
        User owner = user(3L, UserRole.ROLE_BUSINESS);
        bakery.assignOwner(owner);
        bakery.getImages()
                .add(
                        BakeryImage.builder()
                                .imageUrl("x.jpg")
                                .displayOrder(1)
                                .bakery(bakery)
                                .build());
        when(bakeryRepository.findById(8L)).thenReturn(Optional.of(bakery));

        bakeryService.deleteBakery(3L, UserRole.ROLE_BUSINESS, 8L);

        verify(gcsService).deleteQuietly("x.jpg");
        verify(bakeryImageRepository).deleteAllByBakery(bakery);
        verify(bakeryRepository).delete(bakery);
    }

    @Test
    void deleteBakery_throws_whenForbidden() {
        Bakery bakery = bakeryWithId(15L);
        bakery.assignOwner(user(60L, UserRole.ROLE_BUSINESS));
        when(bakeryRepository.findById(15L)).thenReturn(Optional.of(bakery));

        assertThatThrownBy(() -> bakeryService.deleteBakery(61L, UserRole.ROLE_BUSINESS, 15L))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.FORBIDDEN);

        verify(bakeryRepository, never()).delete(any(Bakery.class));
        verify(gcsService, never()).deleteQuietly(any());
    }

    @Test
    void createBread_throws_whenForbidden() {
        Bakery bakery = bakeryWithId(1L);
        bakery.assignOwner(user(1L, UserRole.ROLE_BUSINESS));
        when(bakeryRepository.findById(1L)).thenReturn(Optional.of(bakery));
        CreateBreadRequest request = createBreadRequest("메론빵");

        assertThatThrownBy(() -> bakeryService.createBread(2L, UserRole.ROLE_BUSINESS, 1L, request))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.FORBIDDEN);

        verify(breadRepository, never()).save(any());
    }

    @Test
    void createBread_returnsBreadId_whenOwner() {
        Bakery bakery = bakeryWithId(4L);
        bakery.assignOwner(user(7L, UserRole.ROLE_BUSINESS));
        CreateBreadRequest request = createBreadRequest("소금빵");
        when(bakeryRepository.findById(4L)).thenReturn(Optional.of(bakery));
        when(breadRepository.save(any(Bread.class)))
                .thenAnswer(
                        inv -> {
                            Bread saved = inv.getArgument(0);
                            ReflectionTestUtils.setField(saved, "id", 400L);
                            return saved;
                        });

        Long breadId = bakeryService.createBread(7L, UserRole.ROLE_BUSINESS, 4L, request);

        assertThat(breadId).isEqualTo(400L);
    }

    @Test
    void updateBread_deletesOldImage_whenUrlChanges() {
        Bakery bakery = bakeryWithId(4L);
        bakery.assignOwner(user(7L, UserRole.ROLE_BUSINESS));
        Bread bread =
                Bread.builder()
                        .name("old")
                        .price(1000)
                        .imageUrl("prev.jpg")
                        .bakery(bakery)
                        .breadType(BreadType.BREAD)
                        .signature(false)
                        .selloutMin(0)
                        .build();
        ReflectionTestUtils.setField(bread, "id", 50L);
        UpdateBreadRequest request = new UpdateBreadRequest();
        ReflectionTestUtils.setField(request, "imageUrl", "next.jpg");
        when(bakeryRepository.findById(4L)).thenReturn(Optional.of(bakery));
        when(breadRepository.findById(50L)).thenReturn(Optional.of(bread));

        bakeryService.updateBread(7L, UserRole.ROLE_BUSINESS, 4L, 50L, request);

        verify(gcsService).deleteQuietly("prev.jpg");
    }

    @Test
    void updateBread_throws_whenBreadMissing() {
        Bakery bakery = bakeryWithId(4L);
        bakery.assignOwner(user(7L, UserRole.ROLE_BUSINESS));
        when(bakeryRepository.findById(4L)).thenReturn(Optional.of(bakery));
        when(breadRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(
                        () ->
                                bakeryService.updateBread(
                                        7L,
                                        UserRole.ROLE_BUSINESS,
                                        4L,
                                        999L,
                                        new UpdateBreadRequest()))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.MENU_NOT_FOUND);
    }

    @Test
    void deleteBread_deletesImage_whenPresent() {
        Bakery bakery = bakeryWithId(4L);
        bakery.assignOwner(user(7L, UserRole.ROLE_BUSINESS));
        Bread bread =
                Bread.builder()
                        .name("x")
                        .price(500)
                        .imageUrl("gone.jpg")
                        .bakery(bakery)
                        .breadType(BreadType.BREAD)
                        .signature(false)
                        .selloutMin(0)
                        .build();
        ReflectionTestUtils.setField(bread, "id", 60L);
        when(bakeryRepository.findById(4L)).thenReturn(Optional.of(bakery));
        when(breadRepository.findById(60L)).thenReturn(Optional.of(bread));

        bakeryService.deleteBread(7L, UserRole.ROLE_BUSINESS, 4L, 60L);

        verify(gcsService).deleteQuietly("gone.jpg");
        verify(breadRepository).delete(bread);
    }

    @Test
    void like_throws_whenAlreadyLiked() {
        Bakery bakery = bakeryWithId(1L);
        when(bakeryRepository.findById(1L)).thenReturn(Optional.of(bakery));
        when(bakeryLikeRepository.existsByBakeryIdAndUserId(1L, 5L)).thenReturn(true);

        assertThatThrownBy(() -> bakeryService.like(1L, 5L))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.ALREADY_LIKED);
    }

    @Test
    void like_maps_integrity_violation_when_duplicate_insert() {
        Bakery bakery = bakeryWithId(1L);
        User user = user(5L, UserRole.ROLE_USER);
        when(bakeryRepository.findById(1L)).thenReturn(Optional.of(bakery));
        when(bakeryLikeRepository.existsByBakeryIdAndUserId(1L, 5L)).thenReturn(false);
        when(userRepository.findById(5L)).thenReturn(Optional.of(user));
        doThrow(new DataIntegrityViolationException("dup"))
                .when(bakeryLikeRepository)
                .save(any(BakeryLike.class));

        assertThatThrownBy(() -> bakeryService.like(1L, 5L))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.ALREADY_LIKED);
    }

    @Test
    void unlike_deletes_like_when_like_exists() {
        Bakery bakery = bakeryWithId(1L);
        BakeryLike like =
                BakeryLike.builder().bakery(bakery).user(user(6L, UserRole.ROLE_USER)).build();
        when(bakeryLikeRepository.findByBakeryIdAndUserId(1L, 6L)).thenReturn(Optional.of(like));

        bakeryService.unlike(1L, 6L);

        verify(bakeryLikeRepository).delete(like);
    }

    @Test
    void unlike_throws_whenNotLiked() {
        when(bakeryLikeRepository.findByBakeryIdAndUserId(1L, 8L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> bakeryService.unlike(1L, 8L))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.NOT_LIKED);

        verify(bakeryLikeRepository, never()).delete(any());
    }

    @Test
    void like_savesLike_whenUserAndBakeryExist() {
        Bakery bakery = bakeryWithId(1L);
        User liker = user(5L, UserRole.ROLE_USER);
        when(bakeryRepository.findById(1L)).thenReturn(Optional.of(bakery));
        when(bakeryLikeRepository.existsByBakeryIdAndUserId(1L, 5L)).thenReturn(false);
        when(userRepository.findById(5L)).thenReturn(Optional.of(liker));

        bakeryService.like(1L, 5L);

        ArgumentCaptor<BakeryLike> captor = ArgumentCaptor.forClass(BakeryLike.class);
        verify(bakeryLikeRepository).save(captor.capture());
        assertThat(captor.getValue().getBakery()).isSameAs(bakery);
        assertThat(captor.getValue().getUser()).isSameAs(liker);
    }

    @Test
    void createReview_updates_rating_when_save_succeeds() {
        Bakery bakery = bakeryWithId(20L);
        User author = user(30L, UserRole.ROLE_USER);
        CreateReviewRequest request = createReviewRequest("좋아요", 5);
        when(bakeryRepository.findById(20L)).thenReturn(Optional.of(bakery));
        when(userRepository.findById(30L)).thenReturn(Optional.of(author));
        when(reviewRepository.save(any(Review.class)))
                .thenAnswer(
                        inv -> {
                            Review r = inv.getArgument(0);
                            ReflectionTestUtils.setField(r, "id", 900L);
                            return r;
                        });
        when(reviewRepository.findAverageRatingByBakeryId(20L)).thenReturn(Optional.of(4.25));

        Long reviewId = bakeryService.createReview(20L, 30L, request);

        assertThat(reviewId).isEqualTo(900L);
        assertThat(bakery.getRating()).isEqualTo(4.25);
    }

    @Test
    void createReview_throws_when_bakery_missing() {
        CreateReviewRequest request = createReviewRequest("nice", 5);
        when(bakeryRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> bakeryService.createReview(99L, 30L, request))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.BAKERY_NOT_FOUND);

        verify(reviewRepository, never()).save(any(Review.class));
    }

    @Test
    void createReview_throws_when_user_missing() {
        CreateReviewRequest request = createReviewRequest("nice", 5);
        when(bakeryRepository.findById(20L)).thenReturn(Optional.of(bakeryWithId(20L)));
        when(userRepository.findById(77L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> bakeryService.createReview(20L, 77L, request))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.USER_NOT_FOUND);

        verify(reviewRepository, never()).save(any(Review.class));
    }

    @Test
    void getReviews_throws_whenBakeryMissing() {
        when(bakeryRepository.existsById(1L)).thenReturn(false);

        assertThatThrownBy(() -> bakeryService.getReviews(1L, ReviewSortType.LATEST, 0, 10))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.BAKERY_NOT_FOUND);
    }

    @Test
    void getReviews_returns_paged_sorted_by_created_desc_when_default_sort() {
        Review review =
                Review.builder()
                        .content("review")
                        .rating(4)
                        .imageUrls(List.of("r1.jpg"))
                        .user(user(30L, UserRole.ROLE_USER))
                        .bakery(bakeryWithId(20L))
                        .build();
        ReflectionTestUtils.setField(review, "id", 101L);

        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        when(bakeryRepository.existsById(20L)).thenReturn(true);
        when(reviewRepository.findAllByBakeryId(eq(20L), pageableCaptor.capture()))
                .thenReturn(new PageImpl<>(List.of(review), PageRequest.of(0, 10), 1));

        var result = bakeryService.getReviews(20L, ReviewSortType.LATEST, 0, 10);

        assertThat(result.getReviews()).hasSize(1);
        assertThat(result.getReviews().get(0).getId()).isEqualTo(101L);
        assertThat(result.getTotal()).isEqualTo(1);
        assertThat(result.isHasNext()).isFalse();
        assertThat(pageableCaptor.getValue().getSort())
                .isEqualTo(Sort.by("createdAt").descending());
    }

    @Test
    void getReviews_sortsByRatingDescending_whenHighRatingRequested() {
        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        when(bakeryRepository.existsById(20L)).thenReturn(true);
        when(reviewRepository.findAllByBakeryId(eq(20L), pageableCaptor.capture()))
                .thenReturn(new PageImpl<>(List.of(), PageRequest.of(0, 10), 0));

        bakeryService.getReviews(20L, ReviewSortType.RATING_HIGH, 0, 10);

        assertThat(pageableCaptor.getValue().getSort()).isEqualTo(Sort.by("rating").descending());
    }

    @Test
    void getReviews_sortsByRatingAscending_whenLowRatingRequested() {
        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        when(bakeryRepository.existsById(20L)).thenReturn(true);
        when(reviewRepository.findAllByBakeryId(eq(20L), pageableCaptor.capture()))
                .thenReturn(new PageImpl<>(List.of(), PageRequest.of(0, 10), 0));

        bakeryService.getReviews(20L, ReviewSortType.RATING_LOW, 0, 10);

        assertThat(pageableCaptor.getValue().getSort()).isEqualTo(Sort.by("rating").ascending());
    }

    @Test
    void updateReview_throws_when_review_missing() {
        Bakery bakery = bakeryWithId(20L);
        when(bakeryRepository.findById(20L)).thenReturn(Optional.of(bakery));
        when(reviewRepository.findByIdAndBakeryId(999L, 20L)).thenReturn(Optional.empty());

        assertThatThrownBy(
                        () -> bakeryService.updateReview(20L, 999L, 40L, new UpdateReviewRequest()))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.REVIEW_NOT_FOUND);
    }

    @Test
    void updateReview_throws_whenNotAuthor() {
        Bakery bakery = bakeryWithId(20L);
        User author = user(40L, UserRole.ROLE_USER);
        Review review =
                Review.builder()
                        .content("a")
                        .rating(3)
                        .imageUrls(List.of())
                        .user(author)
                        .bakery(bakery)
                        .build();
        ReflectionTestUtils.setField(review, "id", 11L);
        when(bakeryRepository.findById(20L)).thenReturn(Optional.of(bakery));
        when(reviewRepository.findByIdAndBakeryId(11L, 20L)).thenReturn(Optional.of(review));

        assertThatThrownBy(
                        () -> bakeryService.updateReview(20L, 11L, 77L, new UpdateReviewRequest()))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.FORBIDDEN);
    }

    @Test
    void updateReview_updatesContentAndRating_whenAuthorMatches() {
        Bakery bakery = bakeryWithId(20L);
        User author = user(40L, UserRole.ROLE_USER);
        Review review =
                Review.builder()
                        .content("before")
                        .rating(3)
                        .imageUrls(List.of("old.jpg"))
                        .user(author)
                        .bakery(bakery)
                        .build();
        ReflectionTestUtils.setField(review, "id", 11L);
        UpdateReviewRequest request = new UpdateReviewRequest();
        ReflectionTestUtils.setField(request, "content", "after");
        ReflectionTestUtils.setField(request, "rating", 5);
        ReflectionTestUtils.setField(request, "imageUrls", List.of("new.jpg"));
        when(bakeryRepository.findById(20L)).thenReturn(Optional.of(bakery));
        when(reviewRepository.findByIdAndBakeryId(11L, 20L)).thenReturn(Optional.of(review));
        when(reviewRepository.findAverageRatingByBakeryId(20L)).thenReturn(Optional.of(4.75));

        bakeryService.updateReview(20L, 11L, 40L, request);

        assertThat(review.getContent()).isEqualTo("after");
        assertThat(review.getRating()).isEqualTo(5);
        assertThat(review.getImageUrls()).containsExactly("new.jpg");
        assertThat(bakery.getRating()).isEqualTo(4.75);
        verify(gcsService, never()).deleteQuietly(any());
    }

    @Test
    void deleteReview_succeeds_when_admin_not_author() {
        Bakery bakery = bakeryWithId(20L);
        User author = user(40L, UserRole.ROLE_USER);
        Review review =
                Review.builder()
                        .content("a")
                        .rating(3)
                        .imageUrls(List.of())
                        .user(author)
                        .bakery(bakery)
                        .build();
        ReflectionTestUtils.setField(review, "id", 11L);
        when(bakeryRepository.findById(20L)).thenReturn(Optional.of(bakery));
        when(reviewRepository.findByIdAndBakeryId(11L, 20L)).thenReturn(Optional.of(review));
        when(reviewRepository.findAverageRatingByBakeryId(20L)).thenReturn(Optional.empty());

        bakeryService.deleteReview(20L, 11L, 999L, UserRole.ROLE_ADMIN);

        verify(reviewRepository).delete(review);
        verify(reviewRepository).findAverageRatingByBakeryId(20L);
    }

    @Test
    void deleteReview_throws_when_review_missing() {
        Bakery bakery = bakeryWithId(20L);
        when(bakeryRepository.findById(20L)).thenReturn(Optional.of(bakery));
        when(reviewRepository.findByIdAndBakeryId(999L, 20L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> bakeryService.deleteReview(20L, 999L, 40L, UserRole.ROLE_USER))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.REVIEW_NOT_FOUND);

        verify(reviewRepository, never()).delete(any(Review.class));
    }

    @Test
    void deleteReview_throws_whenRequesterIsNeitherAuthorNorAdmin() {
        Bakery bakery = bakeryWithId(20L);
        User author = user(40L, UserRole.ROLE_USER);
        Review review =
                Review.builder()
                        .content("a")
                        .rating(3)
                        .imageUrls(List.of())
                        .user(author)
                        .bakery(bakery)
                        .build();
        ReflectionTestUtils.setField(review, "id", 11L);
        when(bakeryRepository.findById(20L)).thenReturn(Optional.of(bakery));
        when(reviewRepository.findByIdAndBakeryId(11L, 20L)).thenReturn(Optional.of(review));

        assertThatThrownBy(() -> bakeryService.deleteReview(20L, 11L, 999L, UserRole.ROLE_USER))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.FORBIDDEN);
    }

    private static Bakery bakeryWithId(long id) {
        Bakery b =
                Bakery.builder()
                        .name("테스트빵집")
                        .address("주소")
                        .region("대전")
                        .latitude(36.0)
                        .longitude(127.0)
                        .phone("010")
                        .rating(null)
                        .mapLink("m")
                        .dineInAvailable(true)
                        .parkingAvailable(false)
                        .drinkAvailable(true)
                        .note("")
                        .build();
        ReflectionTestUtils.setField(b, "id", id);
        return b;
    }

    private static User user(long id, UserRole role) {
        User u =
                User.builder()
                        .loginId("u" + id)
                        .password("p")
                        .name("n" + id)
                        .nickname("nick" + id)
                        .email(id + "@t.com")
                        .phone("0100000" + String.format("%04d", id))
                        .role(role)
                        .termsAgreed(true)
                        .privacyAgreed(true)
                        .build();
        ReflectionTestUtils.setField(u, "id", id);
        return u;
    }

    private static CreateBakeryRequest minimalCreateBakeryRequest() {
        CreateBakeryRequest request = new CreateBakeryRequest();
        ReflectionTestUtils.setField(request, "name", "새 빵집");
        ReflectionTestUtils.setField(request, "address", "주소");
        ReflectionTestUtils.setField(request, "region", "대전");
        ReflectionTestUtils.setField(request, "lat", 36.0);
        ReflectionTestUtils.setField(request, "lng", 127.0);
        ReflectionTestUtils.setField(request, "dineInAvailable", true);
        ReflectionTestUtils.setField(request, "parkingAvailable", false);
        ReflectionTestUtils.setField(request, "drinkAvailable", true);
        ReflectionTestUtils.setField(request, "holidayClosed", false);
        return request;
    }

    private static CreateBreadRequest createBreadRequest(String name) {
        CreateBreadRequest request = new CreateBreadRequest();
        ReflectionTestUtils.setField(request, "name", name);
        ReflectionTestUtils.setField(request, "price", 2000);
        ReflectionTestUtils.setField(request, "signature", false);
        return request;
    }

    private static CreateReviewRequest createReviewRequest(String content, int rating) {
        CreateReviewRequest request = new CreateReviewRequest();
        ReflectionTestUtils.setField(request, "content", content);
        ReflectionTestUtils.setField(request, "rating", rating);
        return request;
    }
}
