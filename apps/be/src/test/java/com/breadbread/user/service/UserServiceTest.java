package com.breadbread.user.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.breadbread.auth.entity.VerificationPurpose;
import com.breadbread.auth.redis.PhoneVerificationCache;
import com.breadbread.auth.service.PhoneVerificationRedisService;
import com.breadbread.auth.service.TokenService;
import com.breadbread.bakery.entity.Bakery;
import com.breadbread.bakery.entity.BakeryImage;
import com.breadbread.bakery.entity.BakeryLike;
import com.breadbread.bakery.entity.BakeryPersonality;
import com.breadbread.bakery.entity.BakeryType;
import com.breadbread.bakery.entity.BakeryUseType;
import com.breadbread.bakery.entity.Review;
import com.breadbread.bakery.repository.BakeryImageRepository;
import com.breadbread.bakery.repository.BakeryLikeRepository;
import com.breadbread.bakery.repository.ReviewRepository;
import com.breadbread.course.entity.Course;
import com.breadbread.course.entity.CourseBakery;
import com.breadbread.course.entity.CourseLike;
import com.breadbread.course.entity.ManualCourseInfo;
import com.breadbread.course.repository.CourseLikeRepository;
import com.breadbread.course.repository.CourseRepository;
import com.breadbread.course.repository.RouteRepository;
import com.breadbread.global.exception.CustomException;
import com.breadbread.global.exception.ErrorCode;
import com.breadbread.user.dto.ChangePasswordRequest;
import com.breadbread.user.dto.ChangePhoneRequest;
import com.breadbread.user.dto.CreatePreferenceRequest;
import com.breadbread.user.dto.UpdatePreferenceRequest;
import com.breadbread.user.dto.UpdateProfileRequest;
import com.breadbread.user.entity.User;
import com.breadbread.user.entity.UserPreference;
import com.breadbread.user.entity.UserRole;
import com.breadbread.user.entity.WaitingTolerance;
import com.breadbread.user.repository.UserPreferenceRepository;
import com.breadbread.user.repository.UserRepository;
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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private UserPreferenceRepository userPreferenceRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private PhoneVerificationRedisService phoneVerificationRedisService;
    @Mock private TokenService tokenService;
    @Mock private ReviewRepository reviewRepository;
    @Mock private BakeryLikeRepository bakeryLikeRepository;
    @Mock private BakeryImageRepository bakeryImageRepository;
    @Mock private CourseLikeRepository courseLikeRepository;
    @Mock private CourseRepository courseRepository;
    @Mock private RouteRepository routeRepository;

    @InjectMocks private UserService userService;

    // ───────────────────────────── getUserProfile ─────────────────────────────

    @Test
    void getUserProfile_throws_whenUserMissing() {
        when(userRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.getUserProfile(1L))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.USER_NOT_FOUND);
    }

    @Test
    void getUserProfile_returns_profile_whenUserExists() {
        User user = user(5L);
        when(userRepository.findById(5L)).thenReturn(Optional.of(user));

        var profile = userService.getUserProfile(5L);

        assertThat(profile.getLoginId()).isEqualTo("u5");
        assertThat(profile.getNickname()).isEqualTo("nick5");
        assertThat(profile.getGrade()).isNotNull();
        assertThat(profile.getGradeDescription()).isNotNull();
    }

    @Test
    void getUserProfile_returns_remainingCountToNextGrade_whenUsageCountZero() {
        User user = user(5L);
        when(userRepository.findById(5L)).thenReturn(Optional.of(user));

        var profile = userService.getUserProfile(5L);

        // MORNING_BREAD(0) → CREAM_BREAD(3), usageCount=0 이므로 3 남음
        assertThat(profile.getRemainingCountToNextGrade()).isEqualTo(3);
    }

    @Test
    void getUserProfile_socialUser_true_whenPasswordNull() {
        User user = socialUser(10L);
        when(userRepository.findById(10L)).thenReturn(Optional.of(user));

        var profile = userService.getUserProfile(10L);

        assertThat(profile.isSocialUser()).isTrue();
    }

    // ───────────────────────────── checkNicknameAvailable ─────────────────────────────

    @Test
    void checkNicknameAvailable_returnsTrue_whenNicknameNotTaken() {
        when(userRepository.existsByNicknameAndIdNot("newNick", 1L)).thenReturn(false);

        assertThat(userService.checkNicknameAvailable("newNick", 1L)).isTrue();
    }

    @Test
    void checkNicknameAvailable_returnsFalse_whenNicknameTaken() {
        when(userRepository.existsByNicknameAndIdNot("takenNick", 1L)).thenReturn(true);

        assertThat(userService.checkNicknameAvailable("takenNick", 1L)).isFalse();
    }

    // ───────────────────────────── updateProfile ─────────────────────────────

    @Test
    void updateProfile_throws_whenUserMissing() {
        when(userRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.updateProfile(1L, new UpdateProfileRequest()))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.USER_NOT_FOUND);
    }

    @Test
    void updateProfile_throws_whenNicknameDuplicated() {
        User user = user(1L);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        UpdateProfileRequest request = new UpdateProfileRequest();
        ReflectionTestUtils.setField(request, "nickname", "takenNick");
        when(userRepository.existsByNicknameAndIdNot("takenNick", 1L)).thenReturn(true);

        assertThatThrownBy(() -> userService.updateProfile(1L, request))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.DUPLICATE_NICKNAME);
    }

    @Test
    void updateProfile_updates_nickname_whenAvailable() {
        User user = user(1L);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        UpdateProfileRequest request = new UpdateProfileRequest();
        ReflectionTestUtils.setField(request, "nickname", "newNick");
        when(userRepository.existsByNicknameAndIdNot("newNick", 1L)).thenReturn(false);

        userService.updateProfile(1L, request);

        assertThat(user.getNickname()).isEqualTo("newNick");
        verify(userRepository).saveAndFlush(user);
    }

    @Test
    void updateProfile_throws_DUPLICATE_NICKNAME_whenSaveAndFlushFails() {
        User user = user(1L);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        UpdateProfileRequest request = new UpdateProfileRequest();
        ReflectionTestUtils.setField(request, "nickname", "newNick");
        when(userRepository.existsByNicknameAndIdNot("newNick", 1L)).thenReturn(false);
        doThrow(new DataIntegrityViolationException("unique constraint"))
                .when(userRepository)
                .saveAndFlush(user);

        assertThatThrownBy(() -> userService.updateProfile(1L, request))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.DUPLICATE_NICKNAME);
    }

    @Test
    void updateProfile_skipsNicknameCheck_whenNicknameSameAsCurrent() {
        User user = user(1L);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        UpdateProfileRequest request = new UpdateProfileRequest();
        ReflectionTestUtils.setField(request, "nickname", user.getNickname());

        userService.updateProfile(1L, request);

        verify(userRepository, never()).existsByNicknameAndIdNot(any(), any());
    }

    @Test
    void updateProfile_skipsNicknameCheck_whenNicknameNull() {
        User user = user(1L);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        UpdateProfileRequest request = new UpdateProfileRequest();
        ReflectionTestUtils.setField(request, "email", "new@test.com");

        userService.updateProfile(1L, request);

        verify(userRepository, never()).existsByNicknameAndIdNot(any(), any());
        assertThat(user.getEmail()).isEqualTo("new@test.com");
    }

    // ───────────────────────────── changePhone ─────────────────────────────

    @Test
    void changePhone_throws_whenUserMissing() {
        when(userRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(
                        () ->
                                userService.changePhone(
                                        1L, changePhoneRequest("01011112222", "token")))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.USER_NOT_FOUND);
    }

    @Test
    void changePhone_throws_whenVerificationNotVerified() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user(1L)));
        PhoneVerificationCache unverified =
                PhoneVerificationCache.builder()
                        .phone("01011112222")
                        .purpose(VerificationPurpose.CHANGE_PHONE)
                        .verified(false)
                        .verificationToken("token")
                        .code("123456")
                        .build();
        when(phoneVerificationRedisService.findByVerificationToken("token"))
                .thenReturn(Optional.of(unverified));

        assertThatThrownBy(
                        () ->
                                userService.changePhone(
                                        1L, changePhoneRequest("01011112222", "token")))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.VERIFICATION_NOT_FOUND);
    }

    @Test
    void changePhone_throws_whenVerificationNotFound() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user(1L)));
        when(phoneVerificationRedisService.findByVerificationToken("token"))
                .thenReturn(Optional.empty());

        assertThatThrownBy(
                        () ->
                                userService.changePhone(
                                        1L, changePhoneRequest("01011112222", "token")))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.VERIFICATION_NOT_FOUND);
    }

    @Test
    void changePhone_throws_whenPurposeMismatch() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user(1L)));
        when(phoneVerificationRedisService.findByVerificationToken("token"))
                .thenReturn(
                        Optional.of(
                                verifiedCache("01011112222", VerificationPurpose.SIGNUP, "token")));

        assertThatThrownBy(
                        () ->
                                userService.changePhone(
                                        1L, changePhoneRequest("01011112222", "token")))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.VERIFICATION_PURPOSE_MISMATCH);
    }

    @Test
    void changePhone_throws_whenPhoneMismatch() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user(1L)));
        when(phoneVerificationRedisService.findByVerificationToken("token"))
                .thenReturn(
                        Optional.of(
                                verifiedCache(
                                        "01099999999", VerificationPurpose.CHANGE_PHONE, "token")));

        assertThatThrownBy(
                        () ->
                                userService.changePhone(
                                        1L, changePhoneRequest("01011112222", "token")))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.PHONE_VERIFICATION_MISMATCH);
    }

    @Test
    void changePhone_throws_whenPhoneDuplicated() {
        User user = user(1L);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(phoneVerificationRedisService.findByVerificationToken("token"))
                .thenReturn(
                        Optional.of(
                                verifiedCache(
                                        "01011112222", VerificationPurpose.CHANGE_PHONE, "token")));
        when(userRepository.existsByPhone("01011112222")).thenReturn(true);

        assertThatThrownBy(
                        () ->
                                userService.changePhone(
                                        1L, changePhoneRequest("01011112222", "token")))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.DUPLICATE_PHONE);
    }

    @Test
    void changePhone_updates_whenValid() {
        User user = user(1L);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(phoneVerificationRedisService.findByVerificationToken("token"))
                .thenReturn(
                        Optional.of(
                                verifiedCache(
                                        "01011112222", VerificationPurpose.CHANGE_PHONE, "token")));
        when(userRepository.existsByPhone("01011112222")).thenReturn(false);

        userService.changePhone(1L, changePhoneRequest("01011112222", "token"));

        assertThat(user.getPhone()).isEqualTo("01011112222");
        verify(phoneVerificationRedisService).deleteByVerificationToken("token");
    }

    @Test
    void changePhone_updates_whenSamePhoneReRegistered() {
        User user = user(1L);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(phoneVerificationRedisService.findByVerificationToken("token"))
                .thenReturn(
                        Optional.of(
                                verifiedCache(
                                        user.getPhone(),
                                        VerificationPurpose.CHANGE_PHONE,
                                        "token")));
        when(userRepository.existsByPhone(user.getPhone())).thenReturn(true);

        userService.changePhone(1L, changePhoneRequest(user.getPhone(), "token"));

        assertThat(user.getPhone()).isEqualTo("01000000001");
        verify(phoneVerificationRedisService).deleteByVerificationToken("token");
    }

    // ───────────────────────────── changePassword ─────────────────────────────

    @Test
    void changePassword_throws_whenUserMissing() {
        when(userRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(
                        () ->
                                userService.changePassword(
                                        1L, changePasswordRequest("old", "new", "new")))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.USER_NOT_FOUND);
    }

    @Test
    void changePassword_throws_whenSocialUser() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(socialUser(1L)));

        assertThatThrownBy(
                        () ->
                                userService.changePassword(
                                        1L, changePasswordRequest("old", "new", "new")))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.SOCIAL_ACCOUNT_NO_PASSWORD);
    }

    @Test
    void changePassword_throws_whenCurrentPasswordInvalid() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user(1L)));
        when(passwordEncoder.matches("wrongPw", "p")).thenReturn(false);

        assertThatThrownBy(
                        () ->
                                userService.changePassword(
                                        1L, changePasswordRequest("wrongPw", "newPw1!", "newPw1!")))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.INVALID_PASSWORD);
    }

    @Test
    void changePassword_throws_whenConfirmMismatch() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user(1L)));
        when(passwordEncoder.matches("oldPw", "p")).thenReturn(true);

        assertThatThrownBy(
                        () ->
                                userService.changePassword(
                                        1L,
                                        changePasswordRequest("oldPw", "newPw1!", "different!")))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.PASSWORD_MISMATCH);
    }

    @Test
    void changePassword_updates_andInvalidatesToken_whenValid() {
        User user = user(1L);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("oldPw", "p")).thenReturn(true);
        when(passwordEncoder.encode("newPw1!")).thenReturn("encodedNew");

        userService.changePassword(1L, changePasswordRequest("oldPw", "newPw1!", "newPw1!"));

        assertThat(user.getPassword()).isEqualTo("encodedNew");
        verify(tokenService).invalidateByUserId(1L);
    }

    // ───────────────────────────── savePreference ─────────────────────────────

    @Test
    void savePreference_throws_whenUserMissing() {
        when(userRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.savePreference(1L, createPreferenceRequest()))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.USER_NOT_FOUND);

        verify(userPreferenceRepository, never()).save(any(UserPreference.class));
    }

    @Test
    void savePreference_throws_whenPreferenceAlreadyExists() {
        User user = user(1L);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userPreferenceRepository.findByUserId(1L))
                .thenReturn(Optional.of(mockPreference(user)));

        assertThatThrownBy(() -> userService.savePreference(1L, createPreferenceRequest()))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.PREFERENCE_ALREADY_EXISTS);

        verify(userPreferenceRepository, never()).save(any(UserPreference.class));
    }

    @Test
    void savePreference_saves_whenNoneExists() {
        User user = user(2L);
        when(userRepository.findById(2L)).thenReturn(Optional.of(user));
        when(userPreferenceRepository.findByUserId(2L)).thenReturn(Optional.empty());

        userService.savePreference(2L, createPreferenceRequest());

        ArgumentCaptor<UserPreference> captor = ArgumentCaptor.forClass(UserPreference.class);
        verify(userPreferenceRepository).save(captor.capture());
        assertThat(captor.getValue().getUser()).isSameAs(user);
        assertThat(captor.getValue().getWaitingTolerance()).isEqualTo(WaitingTolerance.UNDER_20);
    }

    // ───────────────────────────── getPreference / updatePreference ─────────────────────────────

    @Test
    void getPreference_throws_whenMissing() {
        when(userPreferenceRepository.findByUserId(3L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.getPreference(3L))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.PREFERENCE_NOT_FOUND);
    }

    @Test
    void updatePreference_throws_whenMissing() {
        when(userPreferenceRepository.findByUserId(3L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.updatePreference(3L, new UpdatePreferenceRequest()))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.PREFERENCE_NOT_FOUND);
    }

    @Test
    void updatePreference_keepsExistingFields_whenRequestFieldsNull() {
        User user = user(4L);
        UserPreference pref =
                UserPreference.builder()
                        .bakeryTypes(List.of(BakeryType.CLASSIC))
                        .bakeryPersonalities(List.of(BakeryPersonality.HIDDEN_GEM))
                        .bakeryUseTypes(List.of(BakeryUseType.TAKEOUT))
                        .waitingTolerance(WaitingTolerance.NO_WAIT)
                        .user(user)
                        .build();
        when(userPreferenceRepository.findByUserId(4L)).thenReturn(Optional.of(pref));

        UpdatePreferenceRequest request = new UpdatePreferenceRequest();
        ReflectionTestUtils.setField(request, "waitingTolerance", WaitingTolerance.ANYTIME);
        // bakeryTypes, bakeryPersonalities, bakeryUseTypes는 null → 기존 값 유지

        userService.updatePreference(4L, request);

        assertThat(pref.getWaitingTolerance()).isEqualTo(WaitingTolerance.ANYTIME);
        assertThat(pref.getBakeryTypes()).containsExactly(BakeryType.CLASSIC);
        assertThat(pref.getBakeryMoods()).containsExactly(BakeryPersonality.HIDDEN_GEM);
        assertThat(pref.getBakeryUseTypes()).containsExactly(BakeryUseType.TAKEOUT);
    }

    @Test
    void updatePreference_updates_fields_whenRequestHasValues() {
        User user = user(4L);
        UserPreference pref =
                UserPreference.builder()
                        .bakeryTypes(List.of(BakeryType.CLASSIC))
                        .bakeryPersonalities(List.of(BakeryPersonality.HIDDEN_GEM))
                        .bakeryUseTypes(List.of(BakeryUseType.TAKEOUT))
                        .waitingTolerance(WaitingTolerance.NO_WAIT)
                        .user(user)
                        .build();
        when(userPreferenceRepository.findByUserId(4L)).thenReturn(Optional.of(pref));

        UpdatePreferenceRequest request = new UpdatePreferenceRequest();
        ReflectionTestUtils.setField(request, "waitingTolerance", WaitingTolerance.ANYTIME);
        ReflectionTestUtils.setField(request, "bakeryTypes", List.of(BakeryType.PLAIN));

        userService.updatePreference(4L, request);

        assertThat(pref.getWaitingTolerance()).isEqualTo(WaitingTolerance.ANYTIME);
        assertThat(pref.getBakeryTypes()).containsExactly(BakeryType.PLAIN);
    }

    // ───────────────────────────── helpers ─────────────────────────────

    private static User user(long id) {
        User user =
                User.builder()
                        .loginId("u" + id)
                        .password("p")
                        .name("n" + id)
                        .nickname("nick" + id)
                        .email(id + "@t.com")
                        .phone("0100000" + String.format("%04d", id))
                        .role(UserRole.ROLE_USER)
                        .termsAgreed(true)
                        .privacyAgreed(true)
                        .build();
        ReflectionTestUtils.setField(user, "id", id);
        return user;
    }

    private static User socialUser(long id) {
        User user =
                User.builder()
                        .loginId(null)
                        .password(null)
                        .name("n" + id)
                        .nickname("nick" + id)
                        .email(id + "@t.com")
                        .phone(null)
                        .role(UserRole.ROLE_USER)
                        .termsAgreed(true)
                        .privacyAgreed(true)
                        .build();
        ReflectionTestUtils.setField(user, "id", id);
        return user;
    }

    private static UserPreference mockPreference(User user) {
        return UserPreference.builder()
                .bakeryTypes(List.of(BakeryType.CLASSIC))
                .bakeryPersonalities(List.of())
                .bakeryUseTypes(List.of(BakeryUseType.TAKEOUT))
                .waitingTolerance(WaitingTolerance.NO_WAIT)
                .user(user)
                .build();
    }

    private static CreatePreferenceRequest createPreferenceRequest() {
        CreatePreferenceRequest request = new CreatePreferenceRequest();
        ReflectionTestUtils.setField(request, "bakeryTypes", List.of(BakeryType.CLASSIC));
        ReflectionTestUtils.setField(
                request, "bakeryPersonalities", List.of(BakeryPersonality.HIDDEN_GEM));
        ReflectionTestUtils.setField(request, "bakeryUseTypes", List.of(BakeryUseType.TAKEOUT));
        ReflectionTestUtils.setField(request, "waitingTolerance", WaitingTolerance.UNDER_20);
        return request;
    }

    private static ChangePhoneRequest changePhoneRequest(String phone, String token) {
        ChangePhoneRequest request = new ChangePhoneRequest();
        ReflectionTestUtils.setField(request, "phone", phone);
        ReflectionTestUtils.setField(request, "verificationToken", token);
        return request;
    }

    private static ChangePasswordRequest changePasswordRequest(
            String current, String newPw, String confirm) {
        ChangePasswordRequest request = new ChangePasswordRequest();
        ReflectionTestUtils.setField(request, "currentPassword", current);
        ReflectionTestUtils.setField(request, "newPassword", newPw);
        ReflectionTestUtils.setField(request, "newPasswordConfirm", confirm);
        return request;
    }

    // ───────────────────────────── getMyReviews ─────────────────────────────

    @Test
    void getMyReviews_returns_empty_page_whenNoReviews() {
        when(reviewRepository.findPageIdsByUserIdOrderByCreatedAtDesc(eq(1L), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(), PageRequest.of(0, 10), 0));

        var result = userService.getMyReviews(1L, 0, 10);

        assertThat(result.getReviews()).isEmpty();
        assertThat(result.getTotal()).isZero();
        assertThat(result.isHasNext()).isFalse();
    }

    @Test
    void getMyReviews_returns_reviews_withBakeryInfo() {
        User user = user(1L);
        Bakery bakery = bakery(10L, "소금빵집");
        Review review1 = review(100L, user, bakery, 5, "맛있어요");
        Review review2 = review(101L, user, bakery, 4, "또 오고싶어요");
        when(reviewRepository.findPageIdsByUserIdOrderByCreatedAtDesc(eq(1L), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(100L, 101L), PageRequest.of(0, 10), 2));
        when(reviewRepository.findAllWithBakeryAndImagesByIdIn(List.of(100L, 101L)))
                .thenReturn(List.of(review1, review2));

        var result = userService.getMyReviews(1L, 0, 10);

        assertThat(result.getReviews()).hasSize(2);
        assertThat(result.getReviews().get(0).getReviewId()).isEqualTo(100L);
        assertThat(result.getReviews().get(0).getBakeryId()).isEqualTo(10L);
        assertThat(result.getReviews().get(0).getBakeryName()).isEqualTo("소금빵집");
        assertThat(result.getReviews().get(0).getRating()).isEqualTo(5);
        assertThat(result.getReviews().get(0).getContent()).isEqualTo("맛있어요");
        assertThat(result.getTotal()).isEqualTo(2);
    }

    @Test
    void getMyReviews_returns_reviews_orderedByCreatedAtDesc() {
        User user = user(1L);
        Bakery bakery = bakery(10L, "소금빵집");
        Review review1 = review(100L, user, bakery, 5, "첫 번째 리뷰");
        Review review2 = review(101L, user, bakery, 3, "두 번째 리뷰");
        when(reviewRepository.findPageIdsByUserIdOrderByCreatedAtDesc(eq(1L), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(101L, 100L), PageRequest.of(0, 10), 2));
        when(reviewRepository.findAllWithBakeryAndImagesByIdIn(List.of(101L, 100L)))
                .thenReturn(List.of(review1, review2));

        var result = userService.getMyReviews(1L, 0, 10);

        assertThat(result.getReviews().get(0).getReviewId()).isEqualTo(101L);
        assertThat(result.getReviews().get(1).getReviewId()).isEqualTo(100L);
    }

    private static Bakery bakery(long id, String name) {
        Bakery bakery =
                Bakery.builder()
                        .name(name)
                        .address("대전시 유성구")
                        .region("유성구")
                        .phone("042-000-0000")
                        .bakeryType(BakeryType.CLASSIC)
                        .build();
        ReflectionTestUtils.setField(bakery, "id", id);
        return bakery;
    }

    private static Review review(long id, User user, Bakery bakery, int rating, String content) {
        Review review =
                Review.builder().user(user).bakery(bakery).rating(rating).content(content).build();
        ReflectionTestUtils.setField(review, "id", id);
        return review;
    }

    private static PhoneVerificationCache verifiedCache(
            String phone, VerificationPurpose purpose, String token) {
        return PhoneVerificationCache.builder()
                .phone(phone)
                .purpose(purpose)
                .verified(true)
                .verificationToken(token)
                .code("123456")
                .build();
    }

    // ───────────────────────────── getLikedBakeries ─────────────────────────────

    @Test
    void getLikedBakeries_returns_empty_page_when_no_likes() {
        when(bakeryLikeRepository.findByUserId(eq(1L), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(), PageRequest.of(0, 10), 0));

        var result = userService.getLikedBakeries(1L, 0, 10);

        assertThat(result.getBakeries()).isEmpty();
        assertThat(result.getTotal()).isZero();
        assertThat(result.isHasNext()).isFalse();
    }

    @Test
    void getLikedBakeries_maps_thumbnail_and_likeCount() {
        Bakery bakery = bakery(10L, "소금빵집");
        User user = user(1L);
        BakeryLike like = BakeryLike.builder().bakery(bakery).user(user).build();
        when(bakeryLikeRepository.findByUserId(eq(1L), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(like), PageRequest.of(0, 10), 1));
        BakeryImage thumb =
                BakeryImage.builder().imageUrl("thumb.jpg").displayOrder(1).bakery(bakery).build();
        when(bakeryImageRepository.findAllByBakeryIdInAndDisplayOrder(List.of(10L), 1))
                .thenReturn(List.of(thumb));
        when(bakeryLikeRepository.countByBakeryIdIn(List.of(10L)))
                .thenReturn(Collections.singletonList(new Object[] {10L, 5L}));

        var result = userService.getLikedBakeries(1L, 0, 10);

        assertThat(result.getBakeries()).hasSize(1);
        assertThat(result.getBakeries().get(0).getThumbnailUrl()).isEqualTo("thumb.jpg");
        assertThat(result.getBakeries().get(0).getLikeCount()).isEqualTo(5L);
        assertThat(result.getBakeries().get(0).isLiked()).isTrue();
        assertThat(result.getTotal()).isEqualTo(1);
        assertThat(result.getPage()).isZero();
        assertThat(result.getSize()).isEqualTo(10);
        assertThat(result.isHasNext()).isFalse();
    }

    @Test
    void getLikedBakeries_sets_liked_true_for_all_items() {
        Bakery b1 = bakery(1L, "빵집A");
        Bakery b2 = bakery(2L, "빵집B");
        User user = user(5L);
        List<BakeryLike> likes =
                List.of(
                        BakeryLike.builder().bakery(b1).user(user).build(),
                        BakeryLike.builder().bakery(b2).user(user).build());
        when(bakeryLikeRepository.findByUserId(eq(5L), any(Pageable.class)))
                .thenReturn(new PageImpl<>(likes, PageRequest.of(0, 10), 2));
        when(bakeryImageRepository.findAllByBakeryIdInAndDisplayOrder(anyList(), eq(1)))
                .thenReturn(List.of());
        when(bakeryLikeRepository.countByBakeryIdIn(anyList())).thenReturn(List.of());

        var result = userService.getLikedBakeries(5L, 0, 10);

        assertThat(result.getBakeries()).hasSize(2);
        assertThat(result.getBakeries()).allSatisfy(b -> assertThat(b.isLiked()).isTrue());
    }

    @Test
    void getLikedBakeries_reflects_hasNext_when_more_pages_exist() {
        Bakery bakery = bakery(99L, "빵집");
        User user = user(7L);
        BakeryLike like = BakeryLike.builder().bakery(bakery).user(user).build();
        when(bakeryLikeRepository.findByUserId(eq(7L), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(like), PageRequest.of(0, 1), 5));
        when(bakeryImageRepository.findAllByBakeryIdInAndDisplayOrder(anyList(), eq(1)))
                .thenReturn(List.of());
        when(bakeryLikeRepository.countByBakeryIdIn(anyList())).thenReturn(List.of());

        var result = userService.getLikedBakeries(7L, 0, 1);

        assertThat(result.isHasNext()).isTrue();
        assertThat(result.getTotal()).isEqualTo(5);
    }

    // ───────────────────────────── getLikedCourses ─────────────────────────────

    @Test
    void getLikedCourses_returns_empty_page_when_no_likes() {
        when(courseLikeRepository.findByUserId(eq(1L), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(), PageRequest.of(0, 10), 0));

        var result = userService.getLikedCourses(1L, 0, 10);

        assertThat(result.getCourses()).isEmpty();
        assertThat(result.getTotal()).isZero();
        assertThat(result.isHasNext()).isFalse();
    }

    @Test
    void getLikedCourses_maps_thumbnail_likeCount_and_saved_status() {
        Course course = course(1L, "서울 코스");
        Bakery bakery = bakery(10L, "A빵집");
        course.addCourseBakery(CourseBakery.builder().visitOrder(1).bakery(bakery).build());
        CourseLike like = CourseLike.builder().course(course).user(user(3L)).build();

        when(courseLikeRepository.findByUserId(eq(3L), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(like), PageRequest.of(0, 10), 1));
        when(bakeryImageRepository.findAllByBakeryIdInAndDisplayOrder(List.of(10L), 1))
                .thenReturn(
                        List.of(
                                BakeryImage.builder()
                                        .imageUrl("t.jpg")
                                        .displayOrder(1)
                                        .bakery(bakery)
                                        .build()));
        when(courseLikeRepository.countByCourseIdIn(List.of(1L)))
                .thenReturn(Collections.singletonList(new Object[] {1L, 4L}));
        when(routeRepository.findLikedCourseIdsByUserId(List.of(1L), 3L)).thenReturn(List.of(1L));

        var result = userService.getLikedCourses(3L, 0, 10);

        assertThat(result.getCourses()).hasSize(1);
        assertThat(result.getCourses().get(0).isLiked()).isTrue();
        assertThat(result.getCourses().get(0).isSaved()).isTrue();
        assertThat(result.getCourses().get(0).getLikeCount()).isEqualTo(4);
        assertThat(result.getCourses().get(0).getBakeries().get(0).getThumbnailUrl())
                .isEqualTo("t.jpg");
        assertThat(result.getTotal()).isEqualTo(1);
        assertThat(result.getPage()).isZero();
        assertThat(result.getSize()).isEqualTo(10);
        assertThat(result.isHasNext()).isFalse();
    }

    @Test
    void getLikedCourses_sets_saved_false_when_not_in_routes() {
        Course course = course(2L, "코스");
        CourseLike like = CourseLike.builder().course(course).user(user(5L)).build();

        when(courseLikeRepository.findByUserId(eq(5L), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(like), PageRequest.of(0, 10), 1));
        when(courseLikeRepository.countByCourseIdIn(List.of(2L))).thenReturn(List.of());
        when(routeRepository.findLikedCourseIdsByUserId(List.of(2L), 5L)).thenReturn(List.of());

        var result = userService.getLikedCourses(5L, 0, 10);

        assertThat(result.getCourses().get(0).isLiked()).isTrue();
        assertThat(result.getCourses().get(0).isSaved()).isFalse();
    }

    @Test
    void getLikedCourses_reflects_hasNext_when_more_pages_exist() {
        Course course = course(3L, "다음 페이지");
        CourseLike like = CourseLike.builder().course(course).user(user(9L)).build();

        when(courseLikeRepository.findByUserId(eq(9L), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(like), PageRequest.of(0, 1), 3));
        when(courseLikeRepository.countByCourseIdIn(anyList())).thenReturn(List.of());
        when(routeRepository.findLikedCourseIdsByUserId(anyList(), eq(9L))).thenReturn(List.of());

        var result = userService.getLikedCourses(9L, 0, 1);

        assertThat(result.isHasNext()).isTrue();
        assertThat(result.getTotal()).isEqualTo(3);
    }

    private static Course course(long id, String name) {
        Course c =
                Course.createManual(
                        name,
                        null,
                        "1h",
                        1000L,
                        "테마",
                        "서울",
                        ManualCourseInfo.builder().editorPick(false).build());
        ReflectionTestUtils.setField(c, "id", id);
        return c;
    }
}
