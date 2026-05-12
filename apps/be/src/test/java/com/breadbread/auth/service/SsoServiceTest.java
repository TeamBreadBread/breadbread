package com.breadbread.auth.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.breadbread.auth.config.OAuth2Properties;
import com.breadbread.auth.dto.SocialLoginRequest;
import com.breadbread.auth.dto.TokenResponse;
import com.breadbread.auth.entity.SsoAccount;
import com.breadbread.auth.entity.SsoProvider;
import com.breadbread.global.exception.CustomException;
import com.breadbread.global.exception.ErrorCode;
import com.breadbread.user.entity.User;
import com.breadbread.user.entity.UserRole;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("unchecked")
class SsoServiceTest {

    @Mock private WebClient webClient;
    @Mock private TokenService tokenService;
    @Mock private OAuth2Properties oAuth2Properties;
    @Mock private SsoAccountService ssoAccountService;
    @Mock private NaverStateRedisService naverStateRedisService;

    private SsoService ssoService;

    private OAuth2Properties.Provider kakaoConfig;
    private OAuth2Properties.Provider googleConfig;
    private OAuth2Properties.NaverProvider naverConfig;

    @BeforeEach
    void setUp() {
        ssoService =
                new SsoService(
                        webClient,
                        tokenService,
                        oAuth2Properties,
                        ssoAccountService,
                        naverStateRedisService);

        kakaoConfig = new OAuth2Properties.Provider();
        kakaoConfig.setClientId("kakao-client");
        kakaoConfig.setClientSecret("kakao-secret");
        kakaoConfig.setTokenUri("https://kauth.kakao.com/oauth/token");
        kakaoConfig.setUserInfoUri("https://kapi.kakao.com/v2/user/me");
        kakaoConfig.setAllowedRedirectUris(List.of("https://app/oauth/kakao/callback"));
        kakaoConfig.setUsePkce(false);

        googleConfig = new OAuth2Properties.Provider();
        googleConfig.setClientId("google-client");
        googleConfig.setClientSecret("google-secret");
        googleConfig.setTokenUri("https://oauth2.googleapis.com/token");
        googleConfig.setUserInfoUri("https://openidconnect.googleapis.com/v1/userinfo");
        googleConfig.setAllowedRedirectUris(List.of("https://app/oauth/google/callback"));
        googleConfig.setUsePkce(false);

        naverConfig = new OAuth2Properties.NaverProvider();
        naverConfig.setClientId("naver-client");
        naverConfig.setClientSecret("naver-secret");
        naverConfig.setTokenUri("https://nid.naver.com/oauth2.0/token");
        naverConfig.setUserInfoUri("https://openapi.naver.com/v1/nid/me");
        naverConfig.setAllowedRedirectUris(List.of("https://app/oauth/naver/callback"));
        naverConfig.setUsePkce(false);
        naverConfig.setStateTtlSeconds(120L);

        lenient().when(oAuth2Properties.getKakao()).thenReturn(kakaoConfig);
        lenient().when(oAuth2Properties.getGoogle()).thenReturn(googleConfig);
        lenient().when(oAuth2Properties.getNaver()).thenReturn(naverConfig);
    }

    @Test
    void issueNaverState_saves_with_ttl_when_properties_set() {
        String state = ssoService.issueNaverState();

        assertThat(state).isNotBlank();
        ArgumentCaptor<String> stateCaptor = ArgumentCaptor.forClass(String.class);
        verify(naverStateRedisService).save(stateCaptor.capture(), eq(120L));
        assertThat(stateCaptor.getValue()).isEqualTo(state);
    }

    @Test
    void socialLogin_throws_when_redirect_uri_not_allowed() {
        SocialLoginRequest request = socialRequest("code", "https://evil/callback", null, null);

        assertThatThrownBy(() -> ssoService.socialLogin(SsoProvider.KAKAO, request))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.INVALID_INPUT_VALUE);
    }

    @Test
    void socialLogin_throws_when_pkce_required_and_code_verifier_missing() {
        googleConfig.setUsePkce(true);
        SocialLoginRequest request =
                socialRequest("code", "https://app/oauth/google/callback", null, null);

        assertThatThrownBy(() -> ssoService.socialLogin(SsoProvider.GOOGLE, request))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.INVALID_INPUT_VALUE);
    }

    @Test
    void socialLogin_throws_when_naver_state_blank() {
        SocialLoginRequest request =
                socialRequest("code", "https://app/oauth/naver/callback", null, "  ");

        assertThatThrownBy(() -> ssoService.socialLogin(SsoProvider.NAVER, request))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.INVALID_INPUT_VALUE);
    }

    @Test
    void socialLogin_throws_when_naver_state_consume_fails() {
        SocialLoginRequest request =
                socialRequest("code", "https://app/oauth/naver/callback", null, "state-1");
        when(naverStateRedisService.consume("state-1")).thenReturn(false);

        assertThatThrownBy(() -> ssoService.socialLogin(SsoProvider.NAVER, request))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.INVALID_SOCIAL_STATE);
    }

    @Test
    void socialLogin_throws_when_token_response_missing_access_token() {
        SocialLoginRequest request =
                socialRequest("code", "https://app/oauth/kakao/callback", null, null);
        stubWebClientPostReturns(Mono.just(Map.of("refresh_token", "only-refresh")));

        assertThatThrownBy(() -> ssoService.socialLogin(SsoProvider.KAKAO, request))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.SOCIAL_LOGIN_FAILED);
    }

    @Test
    void socialLogin_returns_tokens_when_kakao_token_and_user_info_ok() {
        SocialLoginRequest request =
                socialRequest("code", "https://app/oauth/kakao/callback", null, null);
        stubWebClientPostReturns(Mono.just(Map.of("access_token", "kakao-at")));
        Map<String, Object> kakaoAccount = new HashMap<>();
        kakaoAccount.put("email", "k@example.com");
        kakaoAccount.put("name", "카카오이름");
        kakaoAccount.put("profile", Map.of("nickname", "카카오닉"));
        Map<String, Object> userBody = new HashMap<>();
        userBody.put("id", 12345L);
        userBody.put("kakao_account", kakaoAccount);
        stubWebClientGetReturns(kakaoConfig.getUserInfoUri(), Mono.just(userBody));

        User user = user(10L);
        SsoAccount account =
                SsoAccount.builder()
                        .provider(SsoProvider.KAKAO)
                        .providerUserId("12345")
                        .user(user)
                        .build();
        when(ssoAccountService.findOrCreateSsoAccount(eq(SsoProvider.KAKAO), any()))
                .thenReturn(account);
        TokenResponse tokens = TokenResponse.builder().accessToken("a").refreshToken("r").build();
        when(tokenService.issueTokens(user)).thenReturn(tokens);

        TokenResponse result = ssoService.socialLogin(SsoProvider.KAKAO, request);

        assertThat(result).isSameAs(tokens);
        verify(tokenService).issueTokens(user);
    }

    @Test
    void socialLogin_returns_tokens_when_google_user_info_ok() {
        SocialLoginRequest request =
                socialRequest("code", "https://app/oauth/google/callback", null, null);
        stubWebClientPostReturnsForGoogle(Mono.just(Map.of("access_token", "google-at")));
        stubWebClientGetReturns(
                googleConfig.getUserInfoUri(),
                Mono.just(
                        Map.of("sub", "google-sub-1", "email", "g@example.com", "name", "구글사용자")));

        User user = user(20L);
        SsoAccount account =
                SsoAccount.builder()
                        .provider(SsoProvider.GOOGLE)
                        .providerUserId("google-sub-1")
                        .user(user)
                        .build();
        when(ssoAccountService.findOrCreateSsoAccount(eq(SsoProvider.GOOGLE), any()))
                .thenReturn(account);
        TokenResponse tokens = TokenResponse.builder().accessToken("ga").refreshToken("gr").build();
        when(tokenService.issueTokens(user)).thenReturn(tokens);

        TokenResponse result = ssoService.socialLogin(SsoProvider.GOOGLE, request);

        assertThat(result).isSameAs(tokens);
    }

    private void stubWebClientPostReturns(Mono<Map<String, Object>> bodyMono) {
        WebClient.RequestBodyUriSpec uriSpec = mock(WebClient.RequestBodyUriSpec.class);
        WebClient.RequestBodySpec bodySpec = mock(WebClient.RequestBodySpec.class);
        WebClient.ResponseSpec responseSpec = mock(WebClient.ResponseSpec.class);
        doReturn(uriSpec).when(webClient).post();
        doReturn(bodySpec).when(uriSpec).uri(kakaoConfig.getTokenUri());
        doReturn(bodySpec).when(bodySpec).contentType(MediaType.APPLICATION_FORM_URLENCODED);
        doReturn(bodySpec).when(bodySpec).bodyValue(any());
        doReturn(responseSpec).when(bodySpec).retrieve();
        when(responseSpec.onStatus(any(), any())).thenReturn(responseSpec);
        when(responseSpec.bodyToMono(any(ParameterizedTypeReference.class))).thenReturn(bodyMono);
    }

    private void stubWebClientPostReturnsForGoogle(Mono<Map<String, Object>> bodyMono) {
        WebClient.RequestBodyUriSpec uriSpec = mock(WebClient.RequestBodyUriSpec.class);
        WebClient.RequestBodySpec bodySpec = mock(WebClient.RequestBodySpec.class);
        WebClient.ResponseSpec responseSpec = mock(WebClient.ResponseSpec.class);
        doReturn(uriSpec).when(webClient).post();
        doReturn(bodySpec).when(uriSpec).uri(googleConfig.getTokenUri());
        doReturn(bodySpec).when(bodySpec).contentType(MediaType.APPLICATION_FORM_URLENCODED);
        doReturn(bodySpec).when(bodySpec).bodyValue(any());
        doReturn(responseSpec).when(bodySpec).retrieve();
        when(responseSpec.onStatus(any(), any())).thenReturn(responseSpec);
        when(responseSpec.bodyToMono(any(ParameterizedTypeReference.class))).thenReturn(bodyMono);
    }

    private void stubWebClientGetReturns(String uri, Mono<Map<String, Object>> bodyMono) {
        WebClient.RequestHeadersUriSpec<?> uriSpec = mock(WebClient.RequestHeadersUriSpec.class);
        WebClient.RequestHeadersSpec<?> headersSpec = mock(WebClient.RequestHeadersSpec.class);
        WebClient.ResponseSpec responseSpec = mock(WebClient.ResponseSpec.class);
        doReturn(uriSpec).when(webClient).get();
        doReturn(headersSpec).when(uriSpec).uri(uri);
        doReturn(headersSpec).when(headersSpec).header(anyString(), anyString());
        doReturn(responseSpec).when(headersSpec).retrieve();
        when(responseSpec.onStatus(any(), any())).thenReturn(responseSpec);
        when(responseSpec.bodyToMono(any(ParameterizedTypeReference.class))).thenReturn(bodyMono);
    }

    private static SocialLoginRequest socialRequest(
            String code, String redirectUri, String codeVerifier, String state) {
        SocialLoginRequest request = new SocialLoginRequest();
        ReflectionTestUtils.setField(request, "code", code);
        ReflectionTestUtils.setField(request, "redirectUri", redirectUri);
        ReflectionTestUtils.setField(request, "codeVerifier", codeVerifier);
        ReflectionTestUtils.setField(request, "state", state);
        return request;
    }

    private static User user(long id) {
        User user =
                User.builder()
                        .loginId("u" + id)
                        .password("p")
                        .name("n")
                        .nickname("nick")
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
