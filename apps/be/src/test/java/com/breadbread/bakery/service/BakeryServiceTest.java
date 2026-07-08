package com.breadbread.bakery.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.breadbread.bakery.dto.request.BakeryAdminSearch;
import com.breadbread.bakery.dto.request.BakeryAiSearch;
import com.breadbread.bakery.dto.request.BakerySearch;
import com.breadbread.bakery.dto.request.CreateBakeryRequest;
import com.breadbread.bakery.dto.request.UpdateBakeryRequest;
import com.breadbread.bakery.dto.response.ApproveBakeriesResponse;
import com.breadbread.bakery.dto.response.BakeryAdminListResponse;
import com.breadbread.bakery.entity.Bakery;
import com.breadbread.bakery.entity.BakeryLike;
import com.breadbread.bakery.entity.Bread;
import com.breadbread.bakery.entity.CrowdTime;
import com.breadbread.bakery.entity.enums.AdminBakerySortType;
import com.breadbread.bakery.entity.enums.BakerySortType;
import com.breadbread.bakery.entity.enums.BakeryStatus;
import com.breadbread.bakery.entity.enums.BakeryTagType;
import com.breadbread.bakery.entity.enums.BakeryType;
import com.breadbread.bakery.entity.enums.BreadTagType;
import com.breadbread.bakery.entity.enums.BreadType;
import com.breadbread.bakery.entity.enums.CrowdLevel;
import com.breadbread.bakery.entity.enums.DayType;
import com.breadbread.bakery.repository.BakeryImageRepository;
import com.breadbread.bakery.repository.BakeryLikeRepository;
import com.breadbread.bakery.repository.BakeryRepository;
import com.breadbread.bakery.repository.BakeryTagRepository;
import com.breadbread.bakery.repository.BreadRepository;
import com.breadbread.bakery.repository.BreadTagRepository;
import com.breadbread.bakery.repository.CrowdTimeRepository;
import com.breadbread.bakery.repository.ReviewRepository;
import com.breadbread.bakery.service.BakeryImageService.PreviewBatch;
import com.breadbread.course.repository.CourseBakeryRepository;
import com.breadbread.course.repository.CourseDrivingRouteRepository;
import com.breadbread.global.exception.CustomException;
import com.breadbread.global.exception.ErrorCode;
import com.breadbread.user.entity.User;
import com.breadbread.user.entity.UserRole;
import com.breadbread.user.repository.UserRepository;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;
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
    @Mock private CourseBakeryRepository courseBakeryRepository;
    @Mock private CourseDrivingRouteRepository courseDrivingRouteRepository;
    @Mock private GooglePlacesUpdateService googlePlacesUpdateService;
    @Mock private BakeryImageService bakeryImageService;
    @Mock private org.springframework.context.ApplicationEventPublisher eventPublisher;
    @Mock private BakeryTagRepository bakeryTagRepository;
    @Mock private BreadTagRepository breadTagRepository;

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
        CrowdTime crowd = crowdTimeOf(b, DayType.WEEKDAY);

        BakeryAiSearch search = BakeryAiSearch.builder().build();
        when(bakeryRepository.searchForAi(any(BakeryAiSearch.class))).thenReturn(List.of(b));
        when(breadRepository.findAllByBakeryIdIn(List.of(1L))).thenReturn(List.of(bread));
        when(crowdTimeRepository.findAllByBakeryIdIn(List.of(1L))).thenReturn(List.of(crowd));

        var responses = bakeryService.findAllForAi(search);

        assertThat(responses).hasSize(1);
        assertThat(responses.get(0).getId()).isEqualTo(1L);
        assertThat(responses.get(0).getBreads()).hasSize(1);
        assertThat(responses.get(0).getCrowdTimes()).hasSize(1);
    }

    @Test
    void findAllForAi_returns_all_crowd_times_when_open_false() {
        Bakery b = bakeryWithId(1L);
        CrowdTime weekday = crowdTimeOf(b, DayType.WEEKDAY);
        CrowdTime weekend = crowdTimeOf(b, DayType.WEEKEND);

        BakeryAiSearch search = BakeryAiSearch.builder().open(false).build();
        when(bakeryRepository.searchForAi(any(BakeryAiSearch.class))).thenReturn(List.of(b));
        when(breadRepository.findAllByBakeryIdIn(List.of(1L))).thenReturn(List.of());
        when(crowdTimeRepository.findAllByBakeryIdIn(List.of(1L)))
                .thenReturn(List.of(weekday, weekend));

        var responses = bakeryService.findAllForAi(search);

        assertThat(responses.get(0).getCrowdTimes()).hasSize(2);
    }

    @Test
    void findAllForAi_filters_crowd_times_to_weekday_when_weekday_open() {
        Bakery b = bakeryWithId(1L);
        CrowdTime weekday = crowdTimeOf(b, DayType.WEEKDAY);
        CrowdTime weekend = crowdTimeOf(b, DayType.WEEKEND);

        // 2025-05-19 is Monday
        BakeryAiSearch search =
                BakeryAiSearch.builder().open(true).visitDate(LocalDate.of(2025, 5, 19)).build();
        when(bakeryRepository.searchForAi(any(BakeryAiSearch.class))).thenReturn(List.of(b));
        when(breadRepository.findAllByBakeryIdIn(List.of(1L))).thenReturn(List.of());
        when(crowdTimeRepository.findAllByBakeryIdIn(List.of(1L)))
                .thenReturn(List.of(weekday, weekend));

        var responses = bakeryService.findAllForAi(search);

        assertThat(responses.get(0).getCrowdTimes()).hasSize(1);
        assertThat(responses.get(0).getCrowdTimes().get(0).getDayType()).isEqualTo("WEEKDAY");
    }

    @Test
    void findAllForAi_filters_crowd_times_to_weekend_when_weekend_open() {
        Bakery b = bakeryWithId(1L);
        CrowdTime weekday = crowdTimeOf(b, DayType.WEEKDAY);
        CrowdTime weekend = crowdTimeOf(b, DayType.WEEKEND);

        // 2025-05-17 is Saturday
        BakeryAiSearch search =
                BakeryAiSearch.builder().open(true).visitDate(LocalDate.of(2025, 5, 17)).build();
        when(bakeryRepository.searchForAi(any(BakeryAiSearch.class))).thenReturn(List.of(b));
        when(breadRepository.findAllByBakeryIdIn(List.of(1L))).thenReturn(List.of());
        when(crowdTimeRepository.findAllByBakeryIdIn(List.of(1L)))
                .thenReturn(List.of(weekday, weekend));

        var responses = bakeryService.findAllForAi(search);

        assertThat(responses.get(0).getCrowdTimes()).hasSize(1);
        assertThat(responses.get(0).getCrowdTimes().get(0).getDayType()).isEqualTo("WEEKEND");
    }

    @Test
    void findAllForAi_shows_weekday_hours_only_when_weekday_open() {
        Bakery b = bakeryWithId(1L);
        com.breadbread.bakery.entity.BusinessHours bh =
                com.breadbread.bakery.entity.BusinessHours.builder()
                        .weekdayOpen(LocalTime.of(9, 0))
                        .weekdayClose(LocalTime.of(18, 0))
                        .weekendOpen(LocalTime.of(10, 0))
                        .weekendClose(LocalTime.of(17, 0))
                        .build();
        ReflectionTestUtils.setField(b, "businessHours", bh);

        // 2025-05-19 is Monday
        BakeryAiSearch search =
                BakeryAiSearch.builder().open(true).visitDate(LocalDate.of(2025, 5, 19)).build();
        when(bakeryRepository.searchForAi(any(BakeryAiSearch.class))).thenReturn(List.of(b));
        when(breadRepository.findAllByBakeryIdIn(List.of(1L))).thenReturn(List.of());
        when(crowdTimeRepository.findAllByBakeryIdIn(List.of(1L))).thenReturn(List.of());

        var r = bakeryService.findAllForAi(search).get(0);

        assertThat(r.getWeekdayOpen()).isEqualTo(LocalTime.of(9, 0));
        assertThat(r.getWeekdayClose()).isEqualTo(LocalTime.of(18, 0));
        assertThat(r.getWeekendOpen()).isNull();
        assertThat(r.getWeekendClose()).isNull();
    }

    @Test
    void findAllForAi_shows_weekend_hours_only_when_weekend_open() {
        Bakery b = bakeryWithId(1L);
        com.breadbread.bakery.entity.BusinessHours bh =
                com.breadbread.bakery.entity.BusinessHours.builder()
                        .weekdayOpen(LocalTime.of(9, 0))
                        .weekdayClose(LocalTime.of(18, 0))
                        .weekendOpen(LocalTime.of(10, 0))
                        .weekendClose(LocalTime.of(17, 0))
                        .build();
        ReflectionTestUtils.setField(b, "businessHours", bh);

        // 2025-05-17 is Saturday
        BakeryAiSearch search =
                BakeryAiSearch.builder().open(true).visitDate(LocalDate.of(2025, 5, 17)).build();
        when(bakeryRepository.searchForAi(any(BakeryAiSearch.class))).thenReturn(List.of(b));
        when(breadRepository.findAllByBakeryIdIn(List.of(1L))).thenReturn(List.of());
        when(crowdTimeRepository.findAllByBakeryIdIn(List.of(1L))).thenReturn(List.of());

        var r = bakeryService.findAllForAi(search).get(0);

        assertThat(r.getWeekendOpen()).isEqualTo(LocalTime.of(10, 0));
        assertThat(r.getWeekendClose()).isEqualTo(LocalTime.of(17, 0));
        assertThat(r.getWeekdayOpen()).isNull();
        assertThat(r.getWeekdayClose()).isNull();
    }

    @Test
    void findAllForAi_shows_all_hours_when_open_false() {
        Bakery b = bakeryWithId(1L);
        com.breadbread.bakery.entity.BusinessHours bh =
                com.breadbread.bakery.entity.BusinessHours.builder()
                        .weekdayOpen(LocalTime.of(9, 0))
                        .weekdayClose(LocalTime.of(18, 0))
                        .weekendOpen(LocalTime.of(10, 0))
                        .weekendClose(LocalTime.of(17, 0))
                        .build();
        ReflectionTestUtils.setField(b, "businessHours", bh);

        BakeryAiSearch search = BakeryAiSearch.builder().open(false).build();
        when(bakeryRepository.searchForAi(any(BakeryAiSearch.class))).thenReturn(List.of(b));
        when(breadRepository.findAllByBakeryIdIn(List.of(1L))).thenReturn(List.of());
        when(crowdTimeRepository.findAllByBakeryIdIn(List.of(1L))).thenReturn(List.of());

        var r = bakeryService.findAllForAi(search).get(0);

        assertThat(r.getWeekdayOpen()).isEqualTo(LocalTime.of(9, 0));
        assertThat(r.getWeekdayClose()).isEqualTo(LocalTime.of(18, 0));
        assertThat(r.getWeekendOpen()).isEqualTo(LocalTime.of(10, 0));
        assertThat(r.getWeekendClose()).isEqualTo(LocalTime.of(17, 0));
    }

    @Test
    void findOneForAi_returns_response_with_all_breads_and_crowd_times() {
        Bakery b = bakeryWithId(1L);
        Bread bread =
                Bread.builder()
                        .name("소금빵")
                        .price(2500)
                        .imageUrl(null)
                        .bakery(b)
                        .breadType(BreadType.BREAD)
                        .signature(true)
                        .selloutMin(0)
                        .build();
        CrowdTime weekday = crowdTimeOf(b, DayType.WEEKDAY);
        CrowdTime weekend = crowdTimeOf(b, DayType.WEEKEND);

        when(bakeryRepository.findByIdAndActiveTrueAndStatus(1L, BakeryStatus.APPROVED))
                .thenReturn(Optional.of(b));
        when(breadRepository.findAllByBakeryIdIn(List.of(1L))).thenReturn(List.of(bread));
        when(crowdTimeRepository.findAllByBakeryIdIn(List.of(1L)))
                .thenReturn(List.of(weekday, weekend));

        var result = bakeryService.findOneForAi(1L);

        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getBreads()).hasSize(1);
        assertThat(result.getCrowdTimes()).hasSize(2);
    }

    @Test
    void findOneForAi_throws_when_bakery_missing() {
        when(bakeryRepository.findByIdAndActiveTrueAndStatus(99L, BakeryStatus.APPROVED))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> bakeryService.findOneForAi(99L))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.BAKERY_NOT_FOUND);
    }

    @Test
    void findAllForAi_returns_empty_when_no_bakeries() {
        BakeryAiSearch search = BakeryAiSearch.builder().build();
        when(bakeryRepository.searchForAi(any(BakeryAiSearch.class))).thenReturn(List.of());
        when(breadRepository.findAllByBakeryIdIn(List.of())).thenReturn(List.of());
        when(crowdTimeRepository.findAllByBakeryIdIn(List.of())).thenReturn(List.of());

        var responses = bakeryService.findAllForAi(search);

        assertThat(responses).isEmpty();
    }

    @Test
    void search_maps_thumbnail_preview_when_no_gallery_images() {
        Bakery b = bakeryWithId(10L);
        Pageable pageable = PageRequest.of(0, 5);
        when(bakeryRepository.search(any(BakerySearch.class), eq(pageable)))
                .thenReturn(new PageImpl<>(List.of(b), pageable, 1));
        when(bakeryImageService.resolvePreviewBatch(List.of(10L)))
                .thenReturn(new PreviewBatch(Map.of(10L, List.of("thumb.jpg")), Map.of(10L, 0)));
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
        when(bakeryImageService.resolvePreviewBatch(List.of(2L)))
                .thenReturn(
                        new PreviewBatch(
                                Map.of(2L, List.of("u1", "u2", "u3", "u4")), Map.of(2L, 2)));
        when(bakeryLikeRepository.countByBakeryIdIn(List.of(2L))).thenReturn(List.of());

        var result = bakeryService.search(BakerySearch.builder().build(), pageable, null);

        assertThat(result.getBakeries().get(0).getPreviewImageUrls())
                .containsExactly("u1", "u2", "u3", "u4");
        assertThat(result.getBakeries().get(0).getRemainingPreviewImageCount()).isEqualTo(2);
    }

    @Test
    void findOne_throws_whenMissing() {
        when(bakeryRepository.findByIdAndActiveTrueAndStatus(1L, BakeryStatus.APPROVED))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> bakeryService.findOne(1L, null))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.BAKERY_NOT_FOUND);
    }

    @Test
    void findOne_setsLiked_whenUserPresent() {
        Bakery b = bakeryWithId(3L);
        when(bakeryRepository.findByIdAndActiveTrueAndStatus(3L, BakeryStatus.APPROVED))
                .thenReturn(Optional.of(b));
        when(bakeryLikeRepository.countByBakery(b)).thenReturn(4L);
        when(bakeryLikeRepository.existsByBakeryIdAndUserId(3L, 9L)).thenReturn(true);
        when(reviewRepository.countByBakeryIdAndActiveTrue(3L)).thenReturn(12L);
        when(bakeryTagRepository.findPopularTagsByBakeryId(3L, 4)).thenReturn(List.of());

        var detail = bakeryService.findOne(3L, 9L);

        assertThat(detail.getLikeCount()).isEqualTo(4L);
        assertThat(detail.isLiked()).isTrue();
        assertThat(detail.getReviewCount()).isEqualTo(12L);
    }

    @Test
    void findOne_includesPopularBakeryTags() {
        Bakery b = bakeryWithId(4L);
        when(bakeryRepository.findByIdAndActiveTrueAndStatus(4L, BakeryStatus.APPROVED))
                .thenReturn(Optional.of(b));
        when(bakeryLikeRepository.countByBakery(b)).thenReturn(0L);
        when(reviewRepository.countByBakeryIdAndActiveTrue(4L)).thenReturn(0L);
        when(bakeryTagRepository.findPopularTagsByBakeryId(4L, 4))
                .thenReturn(List.of(BakeryTagType.COZY, BakeryTagType.QUIET));

        var detail = bakeryService.findOne(4L, null);

        assertThat(detail.getBakeryTags()).containsExactly(BakeryTagType.COZY, BakeryTagType.QUIET);
    }

    @Test
    void findOne_includesPopularBreadTagsPerBread() {
        Bakery b = bakeryWithId(5L);
        Bread bread = bread(b);
        ReflectionTestUtils.setField(b, "breads", List.of(bread));
        when(bakeryRepository.findByIdAndActiveTrueAndStatus(5L, BakeryStatus.APPROVED))
                .thenReturn(Optional.of(b));
        when(bakeryLikeRepository.countByBakery(b)).thenReturn(0L);
        when(reviewRepository.countByBakeryIdAndActiveTrue(5L)).thenReturn(0L);
        when(bakeryTagRepository.findPopularTagsByBakeryId(5L, 4)).thenReturn(List.of());
        when(breadTagRepository.findPopularTagsByBreadIds(List.of(100L), 4))
                .thenReturn(List.<Object[]>of(new Object[] {100L, BreadTagType.SOFT}));

        var detail = bakeryService.findOne(5L, null);

        assertThat(detail.getBreads().get(0).getBreadTags()).containsExactly(BreadTagType.SOFT);
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
        verify(bakeryImageService)
                .saveImages(eq(10L), any(Bakery.class), eq(new String[] {"a.jpg", "b.jpg"}));
        verify(bakeryRepository).save(any(Bakery.class));
    }

    @Test
    void createBakery_throws_FORBIDDEN_whenRegularUser() {
        User user = user(11L, UserRole.ROLE_USER);
        CreateBakeryRequest request = minimalCreateBakeryRequest();
        when(userRepository.findById(11L)).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> bakeryService.createBakery(11L, request))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.FORBIDDEN);

        verify(bakeryRepository, never()).save(any(Bakery.class));
    }

    @Test
    void updateBakery_throws_whenForbidden() {
        Bakery bakery = bakeryWithId(1L);
        User owner = user(2L, UserRole.ROLE_BUSINESS);
        bakery.assignOwner(owner);
        when(bakeryRepository.findByIdAndActiveTrue(1L)).thenReturn(Optional.of(bakery));

        assertThatThrownBy(
                        () ->
                                bakeryService.updateBakery(
                                        99L, UserRole.ROLE_USER, 1L, new UpdateBakeryRequest()))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.FORBIDDEN);

        verify(bakeryImageService, never()).replaceImages(any(), any(), any());
    }

    @Test
    void updateBakery_replaces_images_when_admin_updates() {
        Bakery bakery = bakeryWithId(5L);
        UpdateBakeryRequest request = new UpdateBakeryRequest();
        ReflectionTestUtils.setField(request, "imageUrls", new String[] {"new.jpg"});
        when(bakeryRepository.findByIdAndActiveTrue(5L)).thenReturn(Optional.of(bakery));

        bakeryService.updateBakery(999L, UserRole.ROLE_ADMIN, 5L, request);

        verify(bakeryImageService)
                .replaceImages(eq(999L), eq(bakery), eq(new String[] {"new.jpg"}));
    }

    @Test
    void updateBakery_skipsImageReplacement_whenImageUrlsIsNull() {
        Bakery bakery = bakeryWithId(12L);
        bakery.assignOwner(user(50L, UserRole.ROLE_BUSINESS));
        UpdateBakeryRequest request = new UpdateBakeryRequest();
        ReflectionTestUtils.setField(request, "name", "이름만변경");
        when(bakeryRepository.findByIdAndActiveTrue(12L)).thenReturn(Optional.of(bakery));

        bakeryService.updateBakery(50L, UserRole.ROLE_BUSINESS, 12L, request);

        assertThat(bakery.getName()).isEqualTo("이름만변경");
        verify(bakeryImageService, never()).replaceImages(any(), any(), any());
    }

    @Test
    void deleteBakery_deletes_images_when_owner_deletes() {
        Bakery bakery = bakeryWithId(8L);
        User owner = user(3L, UserRole.ROLE_BUSINESS);
        bakery.assignOwner(owner);
        when(bakeryRepository.findByIdAndActiveTrue(8L)).thenReturn(Optional.of(bakery));

        bakeryService.deleteBakery(3L, UserRole.ROLE_BUSINESS, 8L);

        verify(bakeryImageService).deleteAllImages(bakery);
        assertThat(bakery.isActive()).isFalse();
    }

    @Test
    void deleteBakery_throws_whenForbidden() {
        Bakery bakery = bakeryWithId(15L);
        bakery.assignOwner(user(60L, UserRole.ROLE_BUSINESS));
        when(bakeryRepository.findByIdAndActiveTrue(15L)).thenReturn(Optional.of(bakery));

        assertThatThrownBy(() -> bakeryService.deleteBakery(61L, UserRole.ROLE_BUSINESS, 15L))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.FORBIDDEN);

        verify(bakeryRepository, never()).delete(any(Bakery.class));
        verify(bakeryImageService, never()).deleteAllImages(any());
    }

    @Test
    void like_throws_whenAlreadyLiked() {
        Bakery bakery = bakeryWithId(1L);
        when(bakeryRepository.findByIdAndActiveTrueAndStatus(1L, BakeryStatus.APPROVED))
                .thenReturn(Optional.of(bakery));
        when(userRepository.findById(5L)).thenReturn(Optional.of(user(5L, UserRole.ROLE_USER)));
        doThrow(new DataIntegrityViolationException("dup"))
                .when(bakeryLikeRepository)
                .saveAndFlush(any(BakeryLike.class));

        assertThatThrownBy(() -> bakeryService.like(1L, 5L))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.ALREADY_LIKED);
    }

    @Test
    void like_maps_integrity_violation_when_duplicate_insert() {
        Bakery bakery = bakeryWithId(1L);
        User user = user(5L, UserRole.ROLE_USER);
        when(bakeryRepository.findByIdAndActiveTrueAndStatus(1L, BakeryStatus.APPROVED))
                .thenReturn(Optional.of(bakery));
        when(userRepository.findById(5L)).thenReturn(Optional.of(user));
        doThrow(new DataIntegrityViolationException("dup"))
                .when(bakeryLikeRepository)
                .saveAndFlush(any(BakeryLike.class));

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
        when(bakeryRepository.findByIdAndActiveTrueAndStatus(1L, BakeryStatus.APPROVED))
                .thenReturn(Optional.of(bakery));
        when(userRepository.findById(5L)).thenReturn(Optional.of(liker));

        bakeryService.like(1L, 5L);

        ArgumentCaptor<BakeryLike> captor = ArgumentCaptor.forClass(BakeryLike.class);
        verify(bakeryLikeRepository).saveAndFlush(captor.capture());
        assertThat(captor.getValue().getBakery()).isSameAs(bakery);
        assertThat(captor.getValue().getUser()).isSameAs(liker);
    }

    @Test
    void updateBakery_invalidatesRouteCache_whenCoordinatesChanged() {
        Bakery bakery = bakeryWithId(7L);
        bakery.assignOwner(user(20L, UserRole.ROLE_BUSINESS));
        UpdateBakeryRequest request = new UpdateBakeryRequest();
        ReflectionTestUtils.setField(request, "lat", 37.5);
        ReflectionTestUtils.setField(request, "lng", 127.0);
        when(bakeryRepository.findByIdAndActiveTrue(7L)).thenReturn(Optional.of(bakery));
        when(courseBakeryRepository.findCourseIdsByBakeryId(7L)).thenReturn(List.of(100L, 200L));

        bakeryService.updateBakery(20L, UserRole.ROLE_BUSINESS, 7L, request);

        verify(courseBakeryRepository).findCourseIdsByBakeryId(7L);
        verify(courseDrivingRouteRepository).deleteByIdCourseIdIn(List.of(100L, 200L));
    }

    @Test
    void updateBakery_doesNotInvalidateCache_whenCoordinatesNotChanged() {
        Bakery bakery = bakeryWithId(7L);
        bakery.assignOwner(user(20L, UserRole.ROLE_BUSINESS));
        UpdateBakeryRequest request = new UpdateBakeryRequest();
        ReflectionTestUtils.setField(request, "name", "이름만바꿈");
        when(bakeryRepository.findByIdAndActiveTrue(7L)).thenReturn(Optional.of(bakery));

        bakeryService.updateBakery(20L, UserRole.ROLE_BUSINESS, 7L, request);

        verify(courseBakeryRepository, never()).findCourseIdsByBakeryId(any());
        verify(courseDrivingRouteRepository, never()).deleteByIdCourseIdIn(any());
    }

    // ── validateSearch ──────────────────────────────────────────────────────

    @Test
    void search_throws_when_NEARBY_and_no_coords() {
        BakerySearch search = BakerySearch.builder().sort(BakerySortType.NEARBY).build();

        assertThatThrownBy(() -> bakeryService.search(search, PageRequest.of(0, 10), null))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.INVALID_INPUT_VALUE);
    }

    @Test
    void search_throws_when_radiusMeters_and_no_coords() {
        BakerySearch search = BakerySearch.builder().radiusMeters(3000).build();

        assertThatThrownBy(() -> bakeryService.search(search, PageRequest.of(0, 10), null))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.INVALID_INPUT_VALUE);
    }

    @Test
    void search_throws_when_radiusMeters_and_only_one_coord() {
        BakerySearch search = BakerySearch.builder().radiusMeters(3000).userLat(36.35).build();

        assertThatThrownBy(() -> bakeryService.search(search, PageRequest.of(0, 10), null))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.INVALID_INPUT_VALUE);
    }

    @Test
    void search_passes_when_NEARBY_with_both_coords() {
        Pageable pageable = PageRequest.of(0, 10);
        BakerySearch search =
                BakerySearch.builder()
                        .sort(BakerySortType.NEARBY)
                        .userLat(36.35)
                        .userLng(127.38)
                        .build();
        when(bakeryRepository.search(any(BakerySearch.class), eq(pageable)))
                .thenReturn(new PageImpl<>(List.of(), pageable, 0));
        when(bakeryImageService.resolvePreviewBatch(List.of()))
                .thenReturn(new PreviewBatch(Map.of(), Map.of()));
        when(bakeryLikeRepository.countByBakeryIdIn(List.of())).thenReturn(List.of());

        var result = bakeryService.search(search, pageable, null);

        assertThat(result.getTotal()).isZero();
    }

    @Test
    void searchSimple_throws_when_NEARBY_and_no_coords() {
        BakerySearch search = BakerySearch.builder().sort(BakerySortType.NEARBY).build();

        assertThatThrownBy(() -> bakeryService.searchSimple(search, PageRequest.of(0, 10)))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.INVALID_INPUT_VALUE);
    }

    @Test
    void searchSimple_throws_when_radiusMeters_and_no_coords() {
        BakerySearch search = BakerySearch.builder().radiusMeters(5000).build();

        assertThatThrownBy(() -> bakeryService.searchSimple(search, PageRequest.of(0, 10)))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.INVALID_INPUT_VALUE);
    }

    @Test
    void searchSimple_passes_when_radiusMeters_with_both_coords() {
        Pageable pageable = PageRequest.of(0, 10);
        BakerySearch search =
                BakerySearch.builder().radiusMeters(3000).userLat(36.35).userLng(127.38).build();
        when(bakeryRepository.search(any(BakerySearch.class), eq(pageable)))
                .thenReturn(new PageImpl<>(List.of(), pageable, 0));
        when(bakeryImageService.resolveThumbnails(List.of())).thenReturn(Map.of());

        var result = bakeryService.searchSimple(search, pageable);

        assertThat(result.getTotal()).isZero();
    }

    // ── approveBakeries ───────────────────────────────────────────────────────

    @Test
    void approveBakeries_transitions_status_to_APPROVED() {
        Bakery bakery = pendingBakeryWithId(100L);
        when(bakeryRepository.findByIdAndActiveTrue(100L)).thenReturn(Optional.of(bakery));

        ApproveBakeriesResponse result = bakeryService.approveBakeries(1L, List.of(100L));

        assertThat(bakery.getStatus()).isEqualTo(BakeryStatus.APPROVED);
        assertThat(result.getSuccessCount()).isEqualTo(1);
        assertThat(result.getSkipCount()).isZero();
    }

    @Test
    void approveBakeries_skips_when_latitude_is_zero() {
        Bakery bakery =
                Bakery.builder()
                        .name("빵집")
                        .address("주소")
                        .region("강남구")
                        .dong("역삼동")
                        .latitude(0.0)
                        .longitude(127.0)
                        .bakeryType(BakeryType.PLAIN)
                        .dineInAvailable(false)
                        .parkingAvailable(false)
                        .drinkAvailable(false)
                        .holidayClosed(false)
                        .build();
        ReflectionTestUtils.setField(bakery, "id", 100L);
        ReflectionTestUtils.setField(bakery, "status", BakeryStatus.PENDING);
        when(bakeryRepository.findByIdAndActiveTrue(100L)).thenReturn(Optional.of(bakery));

        ApproveBakeriesResponse result = bakeryService.approveBakeries(1L, List.of(100L));

        assertThat(bakery.getStatus()).isEqualTo(BakeryStatus.PENDING);
        assertThat(result.getSuccessCount()).isZero();
        assertThat(result.getSkipCount()).isEqualTo(1);
        assertThat(result.getSkippedBakeries()).extracting("id").containsExactly(100L);
    }

    @Test
    void approveBakeries_skips_when_businessHours_incomplete() {
        Bakery bakery =
                Bakery.builder()
                        .name("빵집")
                        .address("주소")
                        .region("강남구")
                        .dong("역삼동")
                        .latitude(37.5)
                        .longitude(127.0)
                        .bakeryType(BakeryType.PLAIN)
                        .weekdayOpen(LocalTime.of(9, 0))
                        .weekdayClose(LocalTime.of(21, 0))
                        // weekendOpen/weekendClose 미입력
                        .dineInAvailable(false)
                        .parkingAvailable(false)
                        .drinkAvailable(false)
                        .holidayClosed(false)
                        .build();
        ReflectionTestUtils.setField(bakery, "id", 100L);
        ReflectionTestUtils.setField(bakery, "status", BakeryStatus.PENDING);
        when(bakeryRepository.findByIdAndActiveTrue(100L)).thenReturn(Optional.of(bakery));

        ApproveBakeriesResponse result = bakeryService.approveBakeries(1L, List.of(100L));

        assertThat(bakery.getStatus()).isEqualTo(BakeryStatus.PENDING);
        assertThat(result.getSuccessCount()).isZero();
        assertThat(result.getSkipCount()).isEqualTo(1);
    }

    @Test
    void approveBakeries_skips_when_required_fields_null() {
        Bakery bakery =
                Bakery.builder()
                        .name(null)
                        .address("주소")
                        .latitude(37.5)
                        .longitude(127.0)
                        .dineInAvailable(false)
                        .parkingAvailable(false)
                        .drinkAvailable(false)
                        .holidayClosed(false)
                        .build();
        ReflectionTestUtils.setField(bakery, "id", 101L);
        ReflectionTestUtils.setField(bakery, "status", BakeryStatus.PENDING);
        when(bakeryRepository.findByIdAndActiveTrue(101L)).thenReturn(Optional.of(bakery));

        ApproveBakeriesResponse result = bakeryService.approveBakeries(1L, List.of(101L));

        assertThat(result.getSuccessCount()).isZero();
        assertThat(result.getSkipCount()).isEqualTo(1);
    }

    @Test
    void approveBakeries_skips_when_already_approved() {
        Bakery bakery = bakeryWithId(100L);
        when(bakeryRepository.findByIdAndActiveTrue(100L)).thenReturn(Optional.of(bakery));

        ApproveBakeriesResponse result = bakeryService.approveBakeries(1L, List.of(100L));

        assertThat(result.getSuccessCount()).isZero();
        assertThat(result.getSkipCount()).isEqualTo(1);
    }

    @Test
    void approveBakeries_partialSuccess_whenMixedConditions() {
        Bakery good = pendingBakeryWithId(1L);
        Bakery bad = bakeryWithId(2L);
        when(bakeryRepository.findByIdAndActiveTrue(1L)).thenReturn(Optional.of(good));
        when(bakeryRepository.findByIdAndActiveTrue(2L)).thenReturn(Optional.of(bad));

        ApproveBakeriesResponse result = bakeryService.approveBakeries(1L, List.of(1L, 2L));

        assertThat(good.getStatus()).isEqualTo(BakeryStatus.APPROVED);
        assertThat(result.getSuccessCount()).isEqualTo(1);
        assertThat(result.getSkipCount()).isEqualTo(1);
        assertThat(result.getSkippedBakeries()).extracting("id").containsExactly(2L);
    }

    // ── rejectBakery ──────────────────────────────────────────────────────────

    @Test
    void rejectBakery_transitions_status_to_REJECTED() {
        Bakery bakery = pendingBakeryWithId(200L);
        when(bakeryRepository.findByIdAndActiveTrue(200L)).thenReturn(Optional.of(bakery));

        bakeryService.rejectBakery(200L);

        assertThat(bakery.getStatus()).isEqualTo(BakeryStatus.REJECTED);
    }

    @Test
    void rejectBakery_throws_BAKERY_NOT_PENDING_when_already_approved() {
        Bakery bakery = bakeryWithId(200L);
        when(bakeryRepository.findByIdAndActiveTrue(200L)).thenReturn(Optional.of(bakery));

        assertThatThrownBy(() -> bakeryService.rejectBakery(200L))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.BAKERY_NOT_PENDING);
    }

    // ── hardDeleteBakery ──────────────────────────────────────────────────────

    @Test
    void hardDeleteBakery_deletes_when_PENDING() {
        Bakery bakery = pendingBakeryWithId(300L);
        when(bakeryRepository.findById(300L)).thenReturn(Optional.of(bakery));
        when(courseBakeryRepository.findCourseIdsByBakeryId(300L)).thenReturn(List.of());

        bakeryService.hardDeleteBakery(300L);

        verify(bakeryImageService).deleteAllImages(bakery);
        verify(bakeryRepository).delete(bakery);
    }

    @Test
    void hardDeleteBakery_deletes_when_REJECTED() {
        Bakery bakery = pendingBakeryWithId(301L);
        ReflectionTestUtils.setField(bakery, "status", BakeryStatus.REJECTED);
        when(bakeryRepository.findById(301L)).thenReturn(Optional.of(bakery));
        when(courseBakeryRepository.findCourseIdsByBakeryId(301L)).thenReturn(List.of());

        bakeryService.hardDeleteBakery(301L);

        verify(bakeryImageService).deleteAllImages(bakery);
        verify(bakeryRepository).delete(bakery);
    }

    @Test
    void hardDeleteBakery_deletes_related_data_before_delete() {
        Bakery bakery = pendingBakeryWithId(303L);
        when(bakeryRepository.findById(303L)).thenReturn(Optional.of(bakery));
        when(courseBakeryRepository.findCourseIdsByBakeryId(303L)).thenReturn(List.of(10L));

        bakeryService.hardDeleteBakery(303L);

        verify(courseDrivingRouteRepository).deleteByIdCourseIdIn(List.of(10L));
        verify(courseBakeryRepository).deleteAllByBakeryId(303L);
        verify(breadRepository).deleteAllByBakeryId(303L);
        verify(crowdTimeRepository).deleteAllByBakeryId(303L);
        verify(reviewRepository).deleteAllByBakeryId(303L);
        verify(bakeryLikeRepository).deleteAllByBakeryId(303L);
        verify(bakeryRepository).delete(bakery);
    }

    @Test
    void hardDeleteBakery_throws_FORBIDDEN_when_APPROVED() {
        Bakery bakery = bakeryWithId(302L);
        when(bakeryRepository.findById(302L)).thenReturn(Optional.of(bakery));

        assertThatThrownBy(() -> bakeryService.hardDeleteBakery(302L))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.FORBIDDEN);

        verify(bakeryRepository, never()).delete(any());
    }

    @Test
    void hardDeleteBakery_throws_BAKERY_NOT_FOUND_when_missing() {
        when(bakeryRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> bakeryService.hardDeleteBakery(999L))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.BAKERY_NOT_FOUND);
    }

    // ── hardDeleteByStatus ────────────────────────────────────────────────────

    @Test
    void hardDeleteByStatus_deletes_all_PENDING_including_inactive() {
        List<Bakery> active = List.of(pendingBakeryWithId(1L));
        List<Bakery> inactive = List.of(pendingBakeryWithId(2L));
        when(bakeryRepository.findAllByActiveTrueAndStatus(BakeryStatus.PENDING))
                .thenReturn(active);
        when(bakeryRepository.findAllByActiveFalseAndStatus(BakeryStatus.PENDING))
                .thenReturn(inactive);
        when(courseBakeryRepository.findCourseIdsByBakeryId(any())).thenReturn(List.of());

        int count = bakeryService.hardDeleteByStatus(BakeryStatus.PENDING);

        assertThat(count).isEqualTo(2);
        verify(bakeryImageService).deleteAllImages(active.get(0));
        verify(bakeryImageService).deleteAllImages(inactive.get(0));
        verify(bakeryRepository).deleteAll(argThat(list -> ((List<?>) list).size() == 2));
    }

    @Test
    void hardDeleteByStatus_throws_FORBIDDEN_when_APPROVED() {
        assertThatThrownBy(() -> bakeryService.hardDeleteByStatus(BakeryStatus.APPROVED))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.FORBIDDEN);

        verify(bakeryRepository, never()).deleteAll(any());
    }

    // ── getBakeryAdmin ────────────────────────────────────

    @Test
    void getBakeryAdmin_returns_detail_with_breads_and_crowdTimes() {
        Bakery bakery = bakeryWithId(10L);
        Bread b = bread(bakery);
        when(bakeryRepository.findById(10L)).thenReturn(Optional.of(bakery));
        when(breadRepository.findAllByBakeryIdIn(List.of(10L))).thenReturn(List.of(b));
        when(crowdTimeRepository.findAllByBakeryIdIn(List.of(10L))).thenReturn(List.of());

        var result = bakeryService.getBakeryAdmin(10L);

        assertThat(result.getId()).isEqualTo(10L);
        assertThat(result.getName()).isEqualTo("테스트빵집");
        assertThat(result.getBreads()).hasSize(1);
        assertThat(result.getCrowdTimes()).isEmpty();
    }

    @Test
    void getBakeryAdmin_throws_when_not_found() {
        when(bakeryRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> bakeryService.getBakeryAdmin(99L))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.BAKERY_NOT_FOUND);
    }

    @Test
    void getBakeryAdmin_returns_pending_bakery() {
        Bakery bakery = pendingBakeryWithId(20L);
        when(bakeryRepository.findById(20L)).thenReturn(Optional.of(bakery));
        when(breadRepository.findAllByBakeryIdIn(List.of(20L))).thenReturn(List.of());
        when(crowdTimeRepository.findAllByBakeryIdIn(List.of(20L))).thenReturn(List.of());

        var result = bakeryService.getBakeryAdmin(20L);

        assertThat(result.getStatus()).isEqualTo(BakeryStatus.PENDING);
    }

    // ── getBakeriesByStatus ────────────────────────────────────

    @Test
    void getBakeriesByStatus_returns_bakeries_via_searchAdmin() {
        Bakery bakery = bakeryWithId(10L);
        Pageable pageable = PageRequest.of(0, 10);
        when(bakeryRepository.searchAdmin(any(BakeryAdminSearch.class), eq(pageable)))
                .thenReturn(new PageImpl<>(List.of(bakery), pageable, 1));
        when(breadRepository.findAllByBakeryIdIn(List.of(10L))).thenReturn(List.of());
        when(crowdTimeRepository.findAllByBakeryIdIn(List.of(10L))).thenReturn(List.of());

        BakeryAdminListResponse response =
                bakeryService.getBakeriesByStatus(
                        null, true, null, AdminBakerySortType.CREATED_AT_DESC, pageable);

        assertThat(response.getTotal()).isEqualTo(1);
        assertThat(response.getBakeries()).hasSize(1);
    }

    @Test
    void getBakeriesByStatus_passes_status_and_active_to_search() {
        Pageable pageable = PageRequest.of(0, 10);
        when(bakeryRepository.searchAdmin(any(BakeryAdminSearch.class), eq(pageable)))
                .thenReturn(new PageImpl<>(List.of(), pageable, 0));
        when(breadRepository.findAllByBakeryIdIn(List.of())).thenReturn(List.of());
        when(crowdTimeRepository.findAllByBakeryIdIn(List.of())).thenReturn(List.of());

        bakeryService.getBakeriesByStatus(
                BakeryStatus.PENDING, false, null, AdminBakerySortType.CREATED_AT_DESC, pageable);

        verify(bakeryRepository)
                .searchAdmin(
                        argThat(
                                s ->
                                        s.getStatus() == BakeryStatus.PENDING
                                                && Boolean.FALSE.equals(s.getActive())),
                        eq(pageable));
    }

    @Test
    void getBakeriesByStatus_passes_keyword_to_search() {
        Pageable pageable = PageRequest.of(0, 10);
        when(bakeryRepository.searchAdmin(any(BakeryAdminSearch.class), eq(pageable)))
                .thenReturn(new PageImpl<>(List.of(), pageable, 0));
        when(breadRepository.findAllByBakeryIdIn(List.of())).thenReturn(List.of());
        when(crowdTimeRepository.findAllByBakeryIdIn(List.of())).thenReturn(List.of());

        bakeryService.getBakeriesByStatus(
                null, true, "성심당", AdminBakerySortType.CREATED_AT_DESC, pageable);

        verify(bakeryRepository)
                .searchAdmin(argThat(s -> "성심당".equals(s.getKeyword())), eq(pageable));
    }

    @Test
    void getBakeriesByStatus_includes_breads_and_crowdTimes_per_bakery() {
        Bakery bakery = bakeryWithId(20L);
        Bread bread = bread(bakery);
        Pageable pageable = PageRequest.of(0, 10);
        when(bakeryRepository.searchAdmin(any(BakeryAdminSearch.class), eq(pageable)))
                .thenReturn(new PageImpl<>(List.of(bakery), pageable, 1));
        when(breadRepository.findAllByBakeryIdIn(List.of(20L))).thenReturn(List.of(bread));
        when(crowdTimeRepository.findAllByBakeryIdIn(List.of(20L))).thenReturn(List.of());

        BakeryAdminListResponse response =
                bakeryService.getBakeriesByStatus(
                        null, true, null, AdminBakerySortType.CREATED_AT_DESC, pageable);

        assertThat(response.getBakeries().get(0).getBreads()).hasSize(1);
        assertThat(response.getBakeries().get(0).getBreads().get(0).getName()).isEqualTo("소금빵");
    }

    @Test
    void getBakeriesByStatus_reflects_hasNext_and_pagination() {
        Bakery bakery = bakeryWithId(30L);
        Pageable pageable = PageRequest.of(0, 1);
        when(bakeryRepository.searchAdmin(any(BakeryAdminSearch.class), eq(pageable)))
                .thenReturn(new PageImpl<>(List.of(bakery), pageable, 5));
        when(breadRepository.findAllByBakeryIdIn(any())).thenReturn(List.of());
        when(crowdTimeRepository.findAllByBakeryIdIn(any())).thenReturn(List.of());

        BakeryAdminListResponse response =
                bakeryService.getBakeriesByStatus(
                        null, true, null, AdminBakerySortType.CREATED_AT_DESC, pageable);

        assertThat(response.isHasNext()).isTrue();
        assertThat(response.getTotal()).isEqualTo(5);
        assertThat(response.getPage()).isZero();
        assertThat(response.getSize()).isEqualTo(1);
    }

    private static Bread bread(Bakery bakery) {
        Bread b =
                Bread.builder()
                        .name("소금빵")
                        .price(3500)
                        .signature(true)
                        .selloutMin(0)
                        .bakery(bakery)
                        .build();
        ReflectionTestUtils.setField(b, "id", 100L);
        return b;
    }

    private static Bakery pendingBakeryWithId(long id) {
        Bakery b =
                Bakery.builder()
                        .name("테스트빵집")
                        .address("주소")
                        .region("강남구")
                        .dong("역삼동")
                        .latitude(37.5)
                        .longitude(127.0)
                        .bakeryType(BakeryType.PLAIN)
                        .weekdayOpen(LocalTime.of(9, 0))
                        .weekdayClose(LocalTime.of(21, 0))
                        .weekendOpen(LocalTime.of(10, 0))
                        .weekendClose(LocalTime.of(20, 0))
                        .dineInAvailable(false)
                        .parkingAvailable(false)
                        .drinkAvailable(false)
                        .holidayClosed(false)
                        .build();
        ReflectionTestUtils.setField(b, "id", id);
        ReflectionTestUtils.setField(b, "status", BakeryStatus.PENDING);
        return b;
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
        ReflectionTestUtils.setField(b, "status", BakeryStatus.APPROVED);
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

    private static CrowdTime crowdTimeOf(Bakery bakery, DayType dayType) {
        return CrowdTime.builder()
                .dayType(dayType)
                .crowdLevel(CrowdLevel.LOW)
                .peakStart(null)
                .peakEnd(null)
                .expectedWaitMin(null)
                .sourceType("test")
                .bakery(bakery)
                .build();
    }
}
