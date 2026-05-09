package com.breadbread.user.service;

import com.breadbread.global.exception.CustomException;
import com.breadbread.global.exception.ErrorCode;
import com.breadbread.user.dto.CreatePreferenceRequest;
import com.breadbread.user.dto.MyProfileResponse;
import com.breadbread.user.dto.PreferenceResponse;
import com.breadbread.user.dto.UpdatePreferenceRequest;
import com.breadbread.user.dto.UserProfileResponse;
import com.breadbread.user.entity.User;
import com.breadbread.user.entity.UserPreference;
import com.breadbread.user.repository.UserPreferenceRepository;
import com.breadbread.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final UserPreferenceRepository userPreferenceRepository;

    @Transactional(readOnly = true)
    public UserProfileResponse getUserProfile(Long userId) {
        User user =
                userRepository
                        .findById(userId)
                        .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
        return UserProfileResponse.builder()
                .loginId(user.getLoginId())
                .name(user.getName())
                .nickname(user.getNickname())
                .email(user.getEmail())
                .phone(user.getPhone())
                .profileImageUrl(user.getProfileImageUrl())
                .grade(user.getGrade().getDisplayName())
                .build();
    }

    @Transactional
    public void savePreference(Long userId, CreatePreferenceRequest request) {
        User user =
                userRepository
                        .findById(userId)
                        .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        if (userPreferenceRepository.findByUserId(userId).isPresent()) {
            throw new CustomException(ErrorCode.PREFERENCE_ALREADY_EXISTS);
        }

        userPreferenceRepository.save(
                UserPreference.builder()
                        .user(user)
                        .bakeryTypes(request.getBakeryTypes())
                        .bakeryPersonalities(request.getBakeryPersonalities())
                        .bakeryUseTypes(request.getBakeryUseTypes())
                        .waitingTolerance(request.getWaitingTolerance())
                        .build());
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
    }

    public MyProfileResponse getMyProfile(Long userId) {
        User user =
                userRepository
                        .findById(userId)
                        .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
        return MyProfileResponse.from(user);
    }
}
