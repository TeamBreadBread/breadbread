package com.breadbread.user.service;

import com.breadbread.global.exception.CustomException;
import com.breadbread.global.exception.ErrorCode;
import com.breadbread.user.dto.SavePreferenceRequest;
import com.breadbread.user.entity.User;
import com.breadbread.user.entity.UserPreference;
import com.breadbread.user.repository.UserPreferenceRepository;
import com.breadbread.user.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final UserPreferenceRepository userPreferenceRepository;

    @Transactional
    public void savePreference(Long userId, SavePreferenceRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        userPreferenceRepository.findByUserId(userId)
                .ifPresentOrElse(
                        pref -> pref.update(request.getBreadTypes(), request.getBakeryPersonalities(),
                                request.getBakeryUseTypes(), request.getWaitingTolerance()),
                        () -> userPreferenceRepository.save(UserPreference.builder()
                                .user(user)
                                .breadTypes(request.getBreadTypes())
                                .bakeryPersonalities(request.getBakeryPersonalities())
                                .bakeryUseTypes(request.getBakeryUseTypes())
                                .waitingTolerance(request.getWaitingTolerance())
                                .build())
                );
    }

}

