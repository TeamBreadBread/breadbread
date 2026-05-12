package com.breadbread.user.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.breadbread.bakery.entity.BakeryPersonality;
import com.breadbread.bakery.entity.BakeryType;
import com.breadbread.bakery.entity.BakeryUseType;
import com.breadbread.global.exception.CustomException;
import com.breadbread.global.exception.ErrorCode;
import com.breadbread.user.dto.CreatePreferenceRequest;
import com.breadbread.user.dto.UpdatePreferenceRequest;
import com.breadbread.user.entity.User;
import com.breadbread.user.entity.UserPreference;
import com.breadbread.user.entity.UserRole;
import com.breadbread.user.entity.WaitingTolerance;
import com.breadbread.user.repository.UserPreferenceRepository;
import com.breadbread.user.repository.UserRepository;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private UserPreferenceRepository userPreferenceRepository;

    @InjectMocks private UserService userService;

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
    }

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

    @Test
    void getMyProfile_returns_summary_whenUserExists() {
        User user = user(6L);
        when(userRepository.findById(6L)).thenReturn(Optional.of(user));

        var my = userService.getMyProfile(6L);

        assertThat(my.getLoginId()).isEqualTo("u6");
        assertThat(my.getPhone()).isEqualTo(user.getPhone());
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
}
