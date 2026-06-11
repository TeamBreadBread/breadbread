package com.breadbread.bakery.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.breadbread.bakery.dto.CreateReviewRequest;
import com.breadbread.bakery.dto.UpdateReviewRequest;
import com.breadbread.bakery.entity.Bakery;
import com.breadbread.bakery.entity.Review;
import com.breadbread.bakery.entity.ReviewSortType;
import com.breadbread.bakery.repository.BakeryRepository;
import com.breadbread.bakery.repository.ReviewRepository;
import com.breadbread.global.dto.UploadFolder;
import com.breadbread.global.exception.CustomException;
import com.breadbread.global.exception.ErrorCode;
import com.breadbread.image.service.GcsService;
import com.breadbread.image.service.TempImageService;
import com.breadbread.user.entity.User;
import com.breadbread.user.entity.UserRole;
import com.breadbread.user.repository.UserRepository;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class ReviewServiceTest {

    @Mock private BakeryRepository bakeryRepository;
    @Mock private UserRepository userRepository;
    @Mock private ReviewRepository reviewRepository;
    @Mock private GcsService gcsService;
    @Mock private TempImageService tempImageService;

    @InjectMocks private ReviewService reviewService;

    @Test
    void createReview_updates_rating_when_save_succeeds() {
        Bakery bakery = bakeryWithId(20L);
        User author = user(30L, UserRole.ROLE_USER);
        CreateReviewRequest request = createReviewRequest("좋아요", 5);
        when(bakeryRepository.findByIdAndActiveTrueAndStatus(
                        20L, com.breadbread.bakery.entity.BakeryStatus.APPROVED))
                .thenReturn(Optional.of(bakery));
        when(userRepository.findById(30L)).thenReturn(Optional.of(author));
        when(reviewRepository.save(any(Review.class)))
                .thenAnswer(
                        inv -> {
                            Review r = inv.getArgument(0);
                            ReflectionTestUtils.setField(r, "id", 900L);
                            return r;
                        });
        when(reviewRepository.findAverageRatingByBakeryId(20L)).thenReturn(Optional.of(4.25));

        Long reviewId = reviewService.createReview(20L, 30L, request);

        assertThat(reviewId).isEqualTo(900L);
        assertThat(bakery.getRating()).isEqualTo(4.25);
    }

    @Test
    void createReview_consumes_temp_images_when_urls_present() {
        Bakery bakery = bakeryWithId(20L);
        User author = user(30L, UserRole.ROLE_USER);
        CreateReviewRequest request = createReviewRequest("좋아요", 5);
        ReflectionTestUtils.setField(
                request,
                "imageUrls",
                List.of(
                        "https://storage.googleapis.com/bucket/reviews/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa.jpg"));
        when(bakeryRepository.findByIdAndActiveTrueAndStatus(
                        20L, com.breadbread.bakery.entity.BakeryStatus.APPROVED))
                .thenReturn(Optional.of(bakery));
        when(userRepository.findById(30L)).thenReturn(Optional.of(author));
        when(reviewRepository.save(any(Review.class))).thenAnswer(inv -> inv.getArgument(0));
        when(reviewRepository.findAverageRatingByBakeryId(20L)).thenReturn(Optional.of(5.0));

        reviewService.createReview(20L, 30L, request);

        verify(tempImageService)
                .consumeOwnedImages(
                        30L,
                        List.of(
                                "https://storage.googleapis.com/bucket/reviews/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa.jpg"),
                        UploadFolder.reviews);
    }

    @Test
    void createReview_throws_when_bakery_missing() {
        CreateReviewRequest request = createReviewRequest("nice", 5);
        when(bakeryRepository.findByIdAndActiveTrueAndStatus(
                        99L, com.breadbread.bakery.entity.BakeryStatus.APPROVED))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> reviewService.createReview(99L, 30L, request))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.BAKERY_NOT_FOUND);

        verify(reviewRepository, never()).save(any(Review.class));
    }

    @Test
    void createReview_throws_when_user_missing() {
        CreateReviewRequest request = createReviewRequest("nice", 5);
        when(bakeryRepository.findByIdAndActiveTrueAndStatus(
                        20L, com.breadbread.bakery.entity.BakeryStatus.APPROVED))
                .thenReturn(Optional.of(bakeryWithId(20L)));
        when(userRepository.findById(77L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> reviewService.createReview(20L, 77L, request))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.USER_NOT_FOUND);

        verify(reviewRepository, never()).save(any(Review.class));
    }

    @Test
    void getReviews_throws_whenBakeryMissing() {
        when(bakeryRepository.existsByIdAndActiveTrueAndStatus(
                        1L, com.breadbread.bakery.entity.BakeryStatus.APPROVED))
                .thenReturn(false);

        assertThatThrownBy(() -> reviewService.getReviews(1L, ReviewSortType.LATEST, 0, 10, null))
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
        when(bakeryRepository.existsByIdAndActiveTrueAndStatus(
                        20L, com.breadbread.bakery.entity.BakeryStatus.APPROVED))
                .thenReturn(true);
        when(reviewRepository.findAllByBakeryIdAndActiveTrue(eq(20L), pageableCaptor.capture()))
                .thenReturn(new PageImpl<>(List.of(review), PageRequest.of(0, 10), 1));

        var result = reviewService.getReviews(20L, ReviewSortType.LATEST, 0, 10, 30L);

        assertThat(result.getReviews()).hasSize(1);
        assertThat(result.getReviews().get(0).getId()).isEqualTo(101L);
        assertThat(result.getReviews().get(0).isAuthor()).isTrue();
        assertThat(result.getTotal()).isEqualTo(1);
        assertThat(result.isHasNext()).isFalse();
        assertThat(pageableCaptor.getValue().getSort())
                .isEqualTo(Sort.by("createdAt").descending());
    }

    @Test
    void getReviews_sortsByRatingDescending_whenHighRatingRequested() {
        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        when(bakeryRepository.existsByIdAndActiveTrueAndStatus(
                        20L, com.breadbread.bakery.entity.BakeryStatus.APPROVED))
                .thenReturn(true);
        when(reviewRepository.findAllByBakeryIdAndActiveTrue(eq(20L), pageableCaptor.capture()))
                .thenReturn(new PageImpl<>(List.of(), PageRequest.of(0, 10), 0));

        reviewService.getReviews(20L, ReviewSortType.RATING_HIGH, 0, 10, null);

        assertThat(pageableCaptor.getValue().getSort()).isEqualTo(Sort.by("rating").descending());
    }

    @Test
    void getReviews_sortsByRatingAscending_whenLowRatingRequested() {
        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        when(bakeryRepository.existsByIdAndActiveTrueAndStatus(
                        20L, com.breadbread.bakery.entity.BakeryStatus.APPROVED))
                .thenReturn(true);
        when(reviewRepository.findAllByBakeryIdAndActiveTrue(eq(20L), pageableCaptor.capture()))
                .thenReturn(new PageImpl<>(List.of(), PageRequest.of(0, 10), 0));

        reviewService.getReviews(20L, ReviewSortType.RATING_LOW, 0, 10, null);

        assertThat(pageableCaptor.getValue().getSort()).isEqualTo(Sort.by("rating").ascending());
    }

    @Test
    void updateReview_throws_when_review_missing() {
        Bakery bakery = bakeryWithId(20L);
        when(bakeryRepository.findByIdAndActiveTrueAndStatus(
                        20L, com.breadbread.bakery.entity.BakeryStatus.APPROVED))
                .thenReturn(Optional.of(bakery));
        when(reviewRepository.findByIdAndBakeryIdAndActiveTrue(999L, 20L))
                .thenReturn(Optional.empty());

        assertThatThrownBy(
                        () -> reviewService.updateReview(20L, 999L, 40L, new UpdateReviewRequest()))
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
        when(bakeryRepository.findByIdAndActiveTrueAndStatus(
                        20L, com.breadbread.bakery.entity.BakeryStatus.APPROVED))
                .thenReturn(Optional.of(bakery));
        when(reviewRepository.findByIdAndBakeryIdAndActiveTrue(11L, 20L))
                .thenReturn(Optional.of(review));

        assertThatThrownBy(
                        () -> reviewService.updateReview(20L, 11L, 77L, new UpdateReviewRequest()))
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
        when(bakeryRepository.findByIdAndActiveTrueAndStatus(
                        20L, com.breadbread.bakery.entity.BakeryStatus.APPROVED))
                .thenReturn(Optional.of(bakery));
        when(reviewRepository.findByIdAndBakeryIdAndActiveTrue(11L, 20L))
                .thenReturn(Optional.of(review));
        when(reviewRepository.findAverageRatingByBakeryId(20L)).thenReturn(Optional.of(4.75));

        reviewService.updateReview(20L, 11L, 40L, request);

        assertThat(review.getContent()).isEqualTo("after");
        assertThat(review.getRating()).isEqualTo(5);
        assertThat(review.getImageUrls()).containsExactly("new.jpg");
        assertThat(bakery.getRating()).isEqualTo(4.75);
        verify(tempImageService).consumeOwnedImages(40L, List.of("new.jpg"), UploadFolder.reviews);
        verify(gcsService).deleteQuietly("old.jpg");
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
        when(bakeryRepository.findByIdAndActiveTrueAndStatus(
                        20L, com.breadbread.bakery.entity.BakeryStatus.APPROVED))
                .thenReturn(Optional.of(bakery));
        when(reviewRepository.findByIdAndBakeryIdAndActiveTrue(11L, 20L))
                .thenReturn(Optional.of(review));
        when(reviewRepository.findAverageRatingByBakeryId(20L)).thenReturn(Optional.empty());

        reviewService.deleteReview(20L, 11L, 999L, UserRole.ROLE_ADMIN);

        assertThat(review.isActive()).isFalse();
        verify(reviewRepository).findAverageRatingByBakeryId(20L);
    }

    @Test
    void deleteReview_throws_when_review_missing() {
        Bakery bakery = bakeryWithId(20L);
        when(bakeryRepository.findByIdAndActiveTrueAndStatus(
                        20L, com.breadbread.bakery.entity.BakeryStatus.APPROVED))
                .thenReturn(Optional.of(bakery));
        when(reviewRepository.findByIdAndBakeryIdAndActiveTrue(999L, 20L))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> reviewService.deleteReview(20L, 999L, 40L, UserRole.ROLE_USER))
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
        when(bakeryRepository.findByIdAndActiveTrueAndStatus(
                        20L, com.breadbread.bakery.entity.BakeryStatus.APPROVED))
                .thenReturn(Optional.of(bakery));
        when(reviewRepository.findByIdAndBakeryIdAndActiveTrue(11L, 20L))
                .thenReturn(Optional.of(review));

        assertThatThrownBy(() -> reviewService.deleteReview(20L, 11L, 999L, UserRole.ROLE_USER))
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

    private static CreateReviewRequest createReviewRequest(String content, int rating) {
        CreateReviewRequest request = new CreateReviewRequest();
        ReflectionTestUtils.setField(request, "content", content);
        ReflectionTestUtils.setField(request, "rating", rating);
        return request;
    }
}
