package com.breadbread.auth.service;

import com.breadbread.auth.dto.SocialUserInfo;
import com.breadbread.auth.entity.SsoAccount;
import com.breadbread.auth.entity.SsoProvider;
import com.breadbread.auth.repository.SsoAccountRepository;
import com.breadbread.global.util.NicknameGenerator;
import com.breadbread.user.entity.User;
import com.breadbread.user.entity.UserRole;
import com.breadbread.user.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class SsoAccountService {
    private final UserRepository userRepository;
    private final SsoAccountRepository ssoAccountRepository;
    private final NicknameGenerator nicknameGenerator;

    @Transactional
    public SsoAccount findOrCreateSsoAccount(SsoProvider provider, SocialUserInfo userInfo) {
        return ssoAccountRepository
                .findByProviderAndProviderUserId(provider, userInfo.getProviderUserId())
                .orElseGet(
                        () -> {
                            log.info("소셜 로그인 신규 가입 provider={}", provider);
                            return createUser(provider, userInfo);
                        });
    }

    private SsoAccount createUser(SsoProvider provider, SocialUserInfo userInfo) {
        User user =
                User.builder()
                        .name(userInfo.getName())
                        .nickname(resolveNickname(userInfo.getNickname()))
                        .email(userInfo.getEmail())
                        .role(UserRole.ROLE_USER)
                        .termsAgreed(true)
                        .privacyAgreed(true)
                        .build();
        userRepository.save(user);

        SsoAccount ssoAccount =
                SsoAccount.builder()
                        .user(user)
                        .provider(provider)
                        .providerUserId(userInfo.getProviderUserId())
                        .build();
        return ssoAccountRepository.save(ssoAccount);
    }

    private String resolveNickname(String nickname) {
        if (nickname != null && !nickname.isBlank() && !userRepository.existsByNickname(nickname)) {
            return nickname;
        }

        String generated;
        do {
            generated = nicknameGenerator.generate();
        } while (userRepository.existsByNickname(generated));
        return generated;
    }
}
