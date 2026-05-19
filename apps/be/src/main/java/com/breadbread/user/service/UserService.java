package com.breadbread.user.service;

import com.breadbread.auth.entity.VerificationPurpose;
import com.breadbread.auth.redis.PhoneVerificationCache;
import com.breadbread.auth.service.PhoneVerificationRedisService;
import com.breadbread.auth.service.TokenService;
import com.breadbread.global.exception.CustomException;
import com.breadbread.global.exception.ErrorCode;
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
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
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
            // 동시에 두 번 저장하면 user_id 유니크 충돌 → 처리되지 않으면 500
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
        try {
            user.updateProfile(request);
            userRepository.saveAndFlush(user);
        } catch (DataIntegrityViolationException e) {
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
}
