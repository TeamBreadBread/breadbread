package com.breadbread.auth.service;

import com.breadbread.auth.dto.SocialLoginRequest;
import com.breadbread.auth.dto.SocialUserInfo;
import com.breadbread.auth.dto.TokenResponse;
import com.breadbread.auth.entity.SsoAccount;
import com.breadbread.auth.entity.SsoProvider;
import com.breadbread.auth.repository.SsoAccountRepository;
import com.breadbread.user.entity.User;
import com.breadbread.user.entity.UserRole;
import com.breadbread.user.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Map;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class SsoService {
    private final UserRepository userRepository;
    private final SsoAccountRepository ssoAccountRepository;
    private final WebClient webClient;
    private final TokenService tokenService;
    private static final Random RANDOM = new Random();

    @Transactional
    public TokenResponse socialLogin(SsoProvider provider, SocialLoginRequest request) {
        SocialUserInfo userInfo = getUserInfo(provider, request.getAccessToken());

        // // 기존 가입 여부 확인, 신규면 회원 생성
        SsoAccount ssoAccount = ssoAccountRepository
                .findByProviderAndProviderUserId(provider, userInfo.getProviderUserId())
                .orElseGet(() -> createUser(provider, userInfo));

        User user = ssoAccount.getUser();

        return tokenService.issueTokens(user);
    }

    private SocialUserInfo getUserInfo(SsoProvider provider, String accessToken) {
        return switch (provider) {
            case KAKAO -> getKakaoUserInfo(accessToken);
            case NAVER -> getNaverUserInfo(accessToken);
            case GOOGLE -> getGoogleUserInfo(accessToken);
        };
    }

    private SocialUserInfo getKakaoUserInfo(String accessToken) {
        Map<String, Object> body = webClient.get()
                .uri("https://kapi.kakao.com/v2/user/me")
                .header("Authorization", "Bearer " + accessToken)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .block();

        Map<String, Object> kakaoAccount = (Map<String, Object>) body.get("kakao_account");
        Map<String, Object> profile = (Map<String, Object>) kakaoAccount.get("profile");

        return SocialUserInfo.builder()
                .providerUserId(body.get("id").toString())
                .email((String) kakaoAccount.get("email"))
                .name((String) profile.get("nickname")) // 카카오 실명 추가 동의 필요
                .build();
    }

    private SocialUserInfo getNaverUserInfo(String accessToken) {
        Map<String, Object> body = webClient.get()
                .uri("https://openapi.naver.com/v1/nid/me")
                .header("Authorization", "Bearer " + accessToken)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .block();

        Map<String, Object> responseBody = (Map<String, Object>) body.get("response");

        return SocialUserInfo.builder()
                .providerUserId((String) responseBody.get("id"))
                .email((String) responseBody.get("email"))
                .name((String) responseBody.get("name"))
                .nickname((String) responseBody.get("nickname"))
                .build();
    }

    private SocialUserInfo getGoogleUserInfo(String accessToken) {
        Map<String, Object> body = webClient.get()
                .uri("https://www.googleapis.com/oauth2/v3/userinfo")
                .header("Authorization", "Bearer " + accessToken)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .block();

        return SocialUserInfo.builder()
                .providerUserId((String) body.get("sub"))
                .email((String) body.get("email"))
                .name((String) body.get("name"))
                .build();
    }

    private SsoAccount createUser(SsoProvider provider, SocialUserInfo userInfo) {
        User user = User.builder()
                .name(userInfo.getName())
                // 닉네임 없는 경우 이름 + 랜덤숫자로 대체 (추후 닉네임 생성 로직 개선 예정)
                .nickname(userInfo.getNickname() != null
                        ? userInfo.getNickname()
                        : userInfo.getName() + (RANDOM.nextInt(100) + 1))
                .email(userInfo.getEmail())
                .role(UserRole.ROLE_USER)
                .termsAgreed(true)
                .privacyAgreed(true)
                .build();
        userRepository.save(user);

        SsoAccount ssoAccount = SsoAccount.builder()
                .user(user)
                .provider(provider)
                .providerUserId(userInfo.getProviderUserId())
                .build();
        return ssoAccountRepository.save(ssoAccount);
    }
}
