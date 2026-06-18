package com.breadbread.user.service;

import com.breadbread.auth.entity.VerificationPurpose;
import com.breadbread.auth.redis.PhoneVerificationCache;
import com.breadbread.auth.repository.SsoAccountRepository;
import com.breadbread.auth.service.PhoneVerificationRedisService;
import com.breadbread.auth.service.TokenService;
import com.breadbread.bakery.dto.response.BakeryCourseSummaryResponse;
import com.breadbread.bakery.dto.response.BakeryListResponse;
import com.breadbread.bakery.dto.response.BakerySummaryResponse;
import com.breadbread.bakery.dto.response.MyReviewListResponse;
import com.breadbread.bakery.dto.response.MyReviewResponse;
import com.breadbread.bakery.entity.Bakery;
import com.breadbread.bakery.entity.BakeryLike;
import com.breadbread.bakery.entity.Review;
import com.breadbread.bakery.repository.BakeryImageRepository;
import com.breadbread.bakery.repository.BakeryLikeRepository;
import com.breadbread.bakery.repository.ReviewRepository;
import com.breadbread.bakery.service.BakeryImageUrlResolver;
import com.breadbread.community.dto.PostListResponse;
import com.breadbread.community.dto.PostSummaryResponse;
import com.breadbread.community.entity.Post;
import com.breadbread.community.entity.PostLike;
import com.breadbread.community.repository.CommentRepository;
import com.breadbread.community.repository.PostLikeRepository;
import com.breadbread.community.repository.PostRepository;
import com.breadbread.course.dto.response.CourseListResponse;
import com.breadbread.course.dto.response.CourseSummaryResponse;
import com.breadbread.course.entity.Course;
import com.breadbread.course.entity.CourseBakery;
import com.breadbread.course.entity.CourseLike;
import com.breadbread.course.repository.CourseLikeRepository;
import com.breadbread.course.repository.CourseRepository;
import com.breadbread.course.repository.RouteRepository;
import com.breadbread.global.dto.UploadFolder;
import com.breadbread.global.exception.CustomException;
import com.breadbread.global.exception.ErrorCode;
import com.breadbread.global.validator.PaginationValidator;
import com.breadbread.image.service.GcsService;
import com.breadbread.image.service.TempImageService;
import com.breadbread.notification.repository.FcmTokenRepository;
import com.breadbread.reservation.entity.ReservationStatus;
import com.breadbread.reservation.repository.ReservationRepository;
import com.breadbread.user.dto.ChangePasswordRequest;
import com.breadbread.user.dto.ChangePhoneRequest;
import com.breadbread.user.dto.CreatePreferenceRequest;
import com.breadbread.user.dto.PreferenceResponse;
import com.breadbread.user.dto.UpdatePreferenceRequest;
import com.breadbread.user.dto.UpdateProfileRequest;
import com.breadbread.user.dto.UserProfileResponse;
import com.breadbread.user.entity.User;
import com.breadbread.user.entity.UserPreference;
import com.breadbread.user.repository.UserPreferenceRepository;
import com.breadbread.user.repository.UserRepository;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {
    private final UserRepository userRepository;
    private final UserPreferenceRepository userPreferenceRepository;
    private final PasswordEncoder passwordEncoder;
    private final PhoneVerificationRedisService phoneVerificationRedisService;
    private final TokenService tokenService;
    private final ReviewRepository reviewRepository;
    private final BakeryLikeRepository bakeryLikeRepository;
    private final BakeryImageRepository bakeryImageRepository;
    private final CourseLikeRepository courseLikeRepository;
    private final CourseRepository courseRepository;
    private final RouteRepository routeRepository;
    private final BakeryImageUrlResolver bakeryImageUrlResolver;
    private final GcsService gcsService;
    private final TempImageService tempImageService;
    private final PostRepository postRepository;
    private final PostLikeRepository postLikeRepository;
    private final CommentRepository commentRepository;
    private final FcmTokenRepository fcmTokenRepository;
    private final SsoAccountRepository ssoAccountRepository;
    private final ReservationRepository reservationRepository;

    @Transactional
    public void savePreference(Long userId, CreatePreferenceRequest request) {
        User user =
                userRepository
                        .findById(userId)
                        .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        if (userPreferenceRepository.findByUserId(userId).isPresent()) {
            throw new CustomException(ErrorCode.PREFERENCE_ALREADY_EXISTS);
        }

        try {
            userPreferenceRepository.save(
                    UserPreference.builder()
                            .user(user)
                            .bakeryTypes(request.getBakeryTypes())
                            .bakeryPersonalities(request.getBakeryPersonalities())
                            .bakeryUseTypes(request.getBakeryUseTypes())
                            .waitingTolerance(request.getWaitingTolerance())
                            .build());
        } catch (DataIntegrityViolationException e) {
            log.warn("[선호도 등록 중복 또는 무결성 위반] userId={}, msg={}", userId, e.getMessage());
            throw new CustomException(ErrorCode.PREFERENCE_ALREADY_EXISTS);
        }
        log.info("선호도 등록: userId={}", userId);
    }

    @Transactional(readOnly = true)
    public PreferenceResponse getPreference(Long userId) {
        UserPreference preference =
                userPreferenceRepository
                        .findByUserId(userId)
                        .orElseThrow(() -> new CustomException(ErrorCode.PREFERENCE_NOT_FOUND));
        return PreferenceResponse.from(preference);
    }

    @Transactional
    public void updatePreference(Long userId, UpdatePreferenceRequest request) {
        UserPreference preference =
                userPreferenceRepository
                        .findByUserId(userId)
                        .orElseThrow(() -> new CustomException(ErrorCode.PREFERENCE_NOT_FOUND));
        preference.update(
                request.getBakeryTypes(),
                request.getBakeryPersonalities(),
                request.getBakeryUseTypes(),
                request.getWaitingTolerance());
        log.info("선호도 수정: userId={}", userId);
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getUserProfile(Long userId) {
        User user =
                userRepository
                        .findById(userId)
                        .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
        return UserProfileResponse.builder()
                .userId(user.getId())
                .loginId(user.getLoginId())
                .name(user.getName())
                .nickname(user.getNickname())
                .email(user.getEmail())
                .phone(user.getPhone())
                .profileImageUrl(user.getProfileImageUrl())
                .grade(user.getGrade().getDisplayName())
                .gradeDescription(user.getGrade().getDescription())
                .remainingCountToNextGrade(
                        user.getGrade().remainingCountToNext(user.getUsageCount()))
                .socialUser(user.getPassword() == null)
                .build();
    }

    public boolean checkNicknameAvailable(String nickname, Long userId) {
        return !userRepository.existsByNicknameAndIdNot(nickname, userId);
    }

    @Transactional
    public void updateProfile(Long userId, UpdateProfileRequest request) {
        User user =
                userRepository
                        .findById(userId)
                        .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
        if (request.getNickname() != null
                && !request.getNickname().equals(user.getNickname())
                && userRepository.existsByNicknameAndIdNot(request.getNickname(), userId)) {
            throw new CustomException(ErrorCode.DUPLICATE_NICKNAME);
        }

        String oldProfileImageUrl = user.getProfileImageUrl();
        String rawNewProfileImageUrl = request.getProfileImageUrl();
        String newProfileImageUrl =
                rawNewProfileImageUrl != null && rawNewProfileImageUrl.isBlank()
                        ? null
                        : rawNewProfileImageUrl;

        try {
            if (rawNewProfileImageUrl != null
                    && !Objects.equals(newProfileImageUrl, oldProfileImageUrl)
                    && newProfileImageUrl != null) {
                gcsService.extractObjectKey(newProfileImageUrl);
                tempImageService.consumeOwnedImages(
                        userId, List.of(newProfileImageUrl), UploadFolder.profiles);
            }

            user.updateProfile(request);
            userRepository.saveAndFlush(user);

            if (rawNewProfileImageUrl != null
                    && !Objects.equals(newProfileImageUrl, oldProfileImageUrl)
                    && oldProfileImageUrl != null
                    && !oldProfileImageUrl.isBlank()) {
                gcsService.deleteQuietly(oldProfileImageUrl);
            }
        } catch (DataIntegrityViolationException e) {
            log.warn("[프로필 수정 중복 또는 무결성 위반] userId={}, msg={}", userId, e.getMessage());
            throw new CustomException(ErrorCode.DUPLICATE_NICKNAME);
        }
        log.info("프로필 수정: userId={}", userId);
    }

    @Transactional
    public void changePhone(Long userId, ChangePhoneRequest request) {
        User user =
                userRepository
                        .findById(userId)
                        .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
        PhoneVerificationCache verification =
                phoneVerificationRedisService
                        .findByVerificationToken(request.getVerificationToken())
                        .orElseThrow(() -> new CustomException(ErrorCode.VERIFICATION_NOT_FOUND));
        if (verification.getPurpose() != VerificationPurpose.CHANGE_PHONE) {
            throw new CustomException(ErrorCode.VERIFICATION_PURPOSE_MISMATCH);
        }
        if (!verification.isVerified()) {
            throw new CustomException(ErrorCode.VERIFICATION_NOT_FOUND);
        }
        if (!verification.getPhone().equals(request.getPhone())) {
            throw new CustomException(ErrorCode.PHONE_VERIFICATION_MISMATCH);
        }
        if (userRepository.existsByPhone(request.getPhone())
                && !request.getPhone().equals(user.getPhone())) {
            throw new CustomException(ErrorCode.DUPLICATE_PHONE);
        }
        user.updatePhone(request.getPhone());
        phoneVerificationRedisService.deleteByVerificationToken(request.getVerificationToken());
        log.info("전화번호 변경: userId={}", userId);
    }

    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request) {
        User user =
                userRepository
                        .findById(userId)
                        .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
        if (user.getPassword() == null) {
            throw new CustomException(ErrorCode.SOCIAL_ACCOUNT_NO_PASSWORD);
        }
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new CustomException(ErrorCode.INVALID_PASSWORD);
        }
        if (!request.getNewPassword().equals(request.getNewPasswordConfirm())) {
            throw new CustomException(ErrorCode.PASSWORD_MISMATCH);
        }
        user.updatePassword(passwordEncoder.encode(request.getNewPassword()));
        tokenService.invalidateByUserId(userId);
        log.info("비밀번호 변경: userId={}", userId);
    }

    @Transactional
    public void withdraw(Long userId) {
        User user =
                userRepository
                        .findById(userId)
                        .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
        if (reservationRepository.existsByUserIdAndStatusInAndActiveTrue(
                userId, List.of(ReservationStatus.CONFIRMED, ReservationStatus.IN_PROGRESS))) {
            throw new CustomException(ErrorCode.WITHDRAW_BLOCKED_BY_RESERVATION);
        }
        String profileImageUrl = user.getProfileImageUrl();
        user.withdraw();
        tempImageService.cleanupByUserId(userId);
        tokenService.invalidateByUserId(userId);
        fcmTokenRepository.deleteAllByUserId(userId);
        ssoAccountRepository.deleteAllByUserId(userId);
        userPreferenceRepository.deleteByUserId(userId);
        if (profileImageUrl != null) {
            gcsService.deleteQuietly(profileImageUrl);
        }
        log.info("회원 탈퇴: userId={}", userId);
    }

    @Transactional(readOnly = true)
    public MyReviewListResponse getMyReviews(Long userId, int page, int size) {
        PaginationValidator.validate(page, size);

        Page<Long> reviewIdsPage =
                reviewRepository.findPageIdsByUserIdOrderByCreatedAtDesc(
                        userId, PageRequest.of(page, size));
        List<Long> reviewIds = reviewIdsPage.getContent();

        Map<Long, Review> reviewsById =
                reviewIds.isEmpty()
                        ? Map.of()
                        : reviewRepository.findAllWithBakeryAndImagesByIdIn(reviewIds).stream()
                                .collect(Collectors.toMap(Review::getId, review -> review));

        List<MyReviewResponse> reviews =
                reviewIds.stream().map(reviewsById::get).map(MyReviewResponse::from).toList();

        return MyReviewListResponse.builder()
                .reviews(reviews)
                .total((int) reviewIdsPage.getTotalElements())
                .page(page)
                .size(size)
                .hasNext(reviewIdsPage.hasNext())
                .build();
    }

    @Transactional(readOnly = true)
    public BakeryListResponse getLikedBakeries(Long userId, int page, int size) {
        PaginationValidator.validate(page, size);

        Page<BakeryLike> likes =
                bakeryLikeRepository.findActiveByUserId(
                        userId, PageRequest.of(page, size, Sort.by("id").descending()));
        List<Bakery> bakeries = likes.getContent().stream().map(BakeryLike::getBakery).toList();
        List<Long> ids = bakeries.stream().map(Bakery::getId).toList();

        Map<Long, String> thumbnailMap = new HashMap<>();
        if (!ids.isEmpty()) {
            bakeryImageRepository
                    .findAllByBakeryIdInAndDisplayOrder(ids, 1)
                    .forEach(
                            img -> {
                                String url = bakeryImageUrlResolver.resolve(img);
                                if (url != null) thumbnailMap.put(img.getBakery().getId(), url);
                            });
        }
        Map<Long, Long> likeCountMap =
                ids.isEmpty()
                        ? Map.of()
                        : bakeryLikeRepository.countByBakeryIdIn(ids).stream()
                                .collect(
                                        Collectors.toMap(
                                                row -> (Long) row[0], row -> (Long) row[1]));
        Map<Long, Long> reviewCountMap =
                ids.isEmpty()
                        ? Map.of()
                        : reviewRepository.countByBakeryIdInAndActiveTrue(ids).stream()
                                .collect(
                                        Collectors.toMap(
                                                row -> (Long) row[0], row -> (Long) row[1]));
        Map<Long, Double> avgRatingMap =
                ids.isEmpty()
                        ? Map.of()
                        : reviewRepository.averageRatingByBakeryIdIn(ids).stream()
                                .collect(
                                        Collectors.toMap(
                                                row -> (Long) row[0], row -> (Double) row[1]));

        return BakeryListResponse.builder()
                .bakeries(
                        bakeries.stream()
                                .map(
                                        b ->
                                                BakerySummaryResponse.from(
                                                        b,
                                                        thumbnailMap.get(b.getId()),
                                                        likeCountMap.getOrDefault(b.getId(), 0L),
                                                        reviewCountMap.getOrDefault(b.getId(), 0L),
                                                        true,
                                                        thumbnailMap.get(b.getId()) == null
                                                                ? List.of()
                                                                : List.of(
                                                                        thumbnailMap.get(
                                                                                b.getId())),
                                                        0,
                                                        avgRatingMap.getOrDefault(b.getId(), 0.0)))
                                .toList())
                .total((int) likes.getTotalElements())
                .page(page)
                .size(size)
                .hasNext(likes.hasNext())
                .build();
    }

    @Transactional(readOnly = true)
    public CourseListResponse getLikedCourses(Long userId, int page, int size) {
        PaginationValidator.validate(page, size);

        Page<CourseLike> likes =
                courseLikeRepository.findActiveByUserId(
                        userId, PageRequest.of(page, size, Sort.by("id").descending()));
        List<Long> courseIds =
                likes.getContent().stream().map(CourseLike::getCourse).map(Course::getId).toList();
        Map<Long, Course> coursesById =
                courseIds.isEmpty()
                        ? Map.of()
                        : courseRepository.findAllActiveWithBakeriesByIdIn(courseIds).stream()
                                .collect(Collectors.toMap(Course::getId, course -> course));
        List<Course> courses =
                courseIds.stream().map(coursesById::get).filter(Objects::nonNull).toList();

        List<Long> allBakeryIds =
                courses.stream()
                        .flatMap(course -> course.getCourseBakeries().stream())
                        .map(cb -> cb.getBakery().getId())
                        .distinct()
                        .toList();

        Map<Long, String> thumbnailMap = new HashMap<>();
        if (!allBakeryIds.isEmpty()) {
            bakeryImageRepository
                    .findAllByBakeryIdInAndDisplayOrder(allBakeryIds, 1)
                    .forEach(
                            img -> {
                                String url = bakeryImageUrlResolver.resolve(img);
                                if (url != null) thumbnailMap.put(img.getBakery().getId(), url);
                            });
        }

        Map<Long, Integer> likeCountMap =
                courseIds.isEmpty()
                        ? Map.of()
                        : courseLikeRepository.countByCourseIdIn(courseIds).stream()
                                .collect(
                                        Collectors.toMap(
                                                row -> (Long) row[0],
                                                row -> ((Long) row[1]).intValue()));

        HashSet<Long> savedCourseIds =
                courseIds.isEmpty()
                        ? new HashSet<>()
                        : new HashSet<>(
                                routeRepository.findLikedCourseIdsByUserId(courseIds, userId));

        List<CourseSummaryResponse> summaries =
                courses.stream()
                        .map(
                                course ->
                                        toCourseSummary(
                                                course, thumbnailMap, likeCountMap, savedCourseIds))
                        .toList();

        return CourseListResponse.builder()
                .courses(summaries)
                .total((int) likes.getTotalElements())
                .page(page)
                .size(size)
                .hasNext(likes.hasNext())
                .build();
    }

    @Transactional(readOnly = true)
    public PostListResponse getMyPosts(Long userId, int page, int size) {
        PaginationValidator.validate(page, size);

        Page<Post> result =
                postRepository.findAllByUserIdAndActiveTrueOrderByCreatedAtDesc(
                        userId, PageRequest.of(page, size));
        List<Long> postIds = result.getContent().stream().map(Post::getId).toList();

        Map<Long, Post> postWithImages =
                postRepository.findAllByIdInWithImageUrls(postIds).stream()
                        .collect(Collectors.toMap(Post::getId, p -> p));
        Map<Long, Long> likeCountMap =
                postLikeRepository.countByPostIdIn(postIds).stream()
                        .collect(Collectors.toMap(r -> (Long) r[0], r -> (Long) r[1]));
        Map<Long, Long> commentCountMap =
                commentRepository.countByPostIdIn(postIds).stream()
                        .collect(Collectors.toMap(r -> (Long) r[0], r -> (Long) r[1]));

        List<PostSummaryResponse> posts =
                result.getContent().stream()
                        .map(
                                post ->
                                        PostSummaryResponse.from(
                                                postWithImages.getOrDefault(post.getId(), post),
                                                likeCountMap
                                                        .getOrDefault(post.getId(), 0L)
                                                        .intValue(),
                                                commentCountMap
                                                        .getOrDefault(post.getId(), 0L)
                                                        .intValue()))
                        .toList();

        return PostListResponse.from(result, posts);
    }

    @Transactional(readOnly = true)
    public PostListResponse getLikedPosts(Long userId, int page, int size) {
        PaginationValidator.validate(page, size);

        Page<PostLike> likedPage =
                postLikeRepository.findByUserIdWithActivePost(userId, PageRequest.of(page, size));
        List<Long> postIds =
                likedPage.getContent().stream().map(pl -> pl.getPost().getId()).toList();

        Map<Long, Post> postWithImages =
                postRepository.findAllByIdInWithImageUrls(postIds).stream()
                        .collect(Collectors.toMap(Post::getId, p -> p));
        Map<Long, Long> likeCountMap =
                postLikeRepository.countByPostIdIn(postIds).stream()
                        .collect(Collectors.toMap(r -> (Long) r[0], r -> (Long) r[1]));
        Map<Long, Long> commentCountMap =
                commentRepository.countByPostIdIn(postIds).stream()
                        .collect(Collectors.toMap(r -> (Long) r[0], r -> (Long) r[1]));

        List<PostSummaryResponse> posts =
                likedPage.getContent().stream()
                        .map(pl -> pl.getPost())
                        .map(
                                post ->
                                        PostSummaryResponse.from(
                                                postWithImages.getOrDefault(post.getId(), post),
                                                likeCountMap
                                                        .getOrDefault(post.getId(), 0L)
                                                        .intValue(),
                                                commentCountMap
                                                        .getOrDefault(post.getId(), 0L)
                                                        .intValue()))
                        .toList();

        return PostListResponse.from(likedPage, posts);
    }

    private CourseSummaryResponse toCourseSummary(
            Course course,
            Map<Long, String> thumbnailMap,
            Map<Long, Integer> likeCountMap,
            HashSet<Long> savedCourseIds) {
        List<BakeryCourseSummaryResponse> bakeries =
                course.getCourseBakeries().stream()
                        .sorted(Comparator.comparingInt(CourseBakery::getVisitOrder))
                        .map(
                                cb ->
                                        BakeryCourseSummaryResponse.from(
                                                cb.getBakery(),
                                                thumbnailMap.get(cb.getBakery().getId())))
                        .toList();
        return CourseSummaryResponse.from(
                course,
                likeCountMap.getOrDefault(course.getId(), 0),
                true,
                savedCourseIds.contains(course.getId()),
                bakeries);
    }
}
