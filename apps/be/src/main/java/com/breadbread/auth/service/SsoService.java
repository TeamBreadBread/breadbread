	package com.breadbread.auth.service;

	import com.breadbread.auth.config.OAuth2Properties;
	import com.breadbread.auth.dto.SocialLoginRequest;
	import com.breadbread.auth.dto.SocialUserInfo;
	import com.breadbread.auth.dto.TokenResponse;
	import com.breadbread.auth.entity.SsoAccount;
	import com.breadbread.auth.entity.SsoProvider;
	import com.breadbread.global.exception.CustomException;
	import com.breadbread.global.exception.ErrorCode;
	import com.breadbread.user.entity.User;
	import lombok.RequiredArgsConstructor;
	import lombok.extern.slf4j.Slf4j;
	import org.springframework.core.ParameterizedTypeReference;
	import org.springframework.http.MediaType;
	import org.springframework.stereotype.Service;
	import org.springframework.util.LinkedMultiValueMap;
	import org.springframework.util.MultiValueMap;
	import org.springframework.web.reactive.function.client.WebClient;
	import reactor.core.publisher.Mono;

	import java.util.List;
	import java.util.Map;

	@Service
	@RequiredArgsConstructor
	@Slf4j
	public class SsoService {
		private final WebClient webClient;
		private final TokenService tokenService;
		private final OAuth2Properties oAuth2Properties;
		private final SsoAccountService ssoAccountService;

		public TokenResponse socialLogin(SsoProvider provider, SocialLoginRequest request) {
			String accessToken = exchangeAccessToken(provider, request);
			SocialUserInfo userInfo = getUserInfo(provider, accessToken);
			SsoAccount ssoAccount = ssoAccountService.findOrCreateSsoAccount(provider, userInfo);
			User user = ssoAccount.getUser();
			log.info("소셜 로그인 성공 provider={} userId={}", provider, user.getId());
			return tokenService.issueTokens(user);
		}

		private String exchangeAccessToken(SsoProvider provider, SocialLoginRequest request) {
			OAuth2Properties.Provider config = switch (provider) {
				case GOOGLE -> oAuth2Properties.getGoogle();
				case KAKAO -> oAuth2Properties.getKakao();
				case NAVER -> oAuth2Properties.getNaver();
			};

			validateRedirectUri(config.getAllowedRedirectUris(), request.getRedirectUri());

			MultiValueMap<String, String> formData = new LinkedMultiValueMap<>();
			formData.add("client_id", config.getClientId());
			formData.add("code", request.getCode());
			formData.add("redirect_uri", request.getRedirectUri());
			formData.add("grant_type", "authorization_code");

			// TODO: Redis 도입 시 Naver OAuth state 서버 검증 추가
			if (provider == SsoProvider.NAVER) {
				if (request.getState() == null || request.getState().isBlank()) {
					throw new CustomException(ErrorCode.INVALID_INPUT_VALUE);
				}
				formData.add("state", request.getState());
			}

			if (config.getClientSecret() != null && !config.getClientSecret().isBlank()) {
				formData.add("client_secret", config.getClientSecret());
			}

			if (config.isUsePkce()) {
				if (request.getCodeVerifier() == null || request.getCodeVerifier().isBlank()) {
					throw new CustomException(ErrorCode.INVALID_INPUT_VALUE);
				}
				formData.add("code_verifier", request.getCodeVerifier());
			}

			Map<String, Object> body = webClient.post()
				.uri(config.getTokenUri())
				.contentType(MediaType.APPLICATION_FORM_URLENCODED)
				.bodyValue(formData)
				.retrieve()
				.onStatus(status -> !status.is2xxSuccessful(), response ->
					response.bodyToMono(String.class).flatMap(errorBody -> {
						log.error("토큰 교환 실패 provider={} status={}", provider, response.statusCode());
						return Mono.error(new CustomException(ErrorCode.SOCIAL_LOGIN_FAILED));
					}))
				.bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
				.block();

			if (body == null || body.get("access_token") == null) {
				throw new CustomException(ErrorCode.SOCIAL_LOGIN_FAILED);
			}

			return (String) body.get("access_token");
		}

		private void validateRedirectUri(List<String> allowedRedirectUris, String redirectUri) {
			if (!allowedRedirectUris.contains(redirectUri)) {
				throw new CustomException(ErrorCode.INVALID_INPUT_VALUE);
			}
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
					.uri(oAuth2Properties.getKakao().getUserInfoUri())
					.header("Authorization", "Bearer " + accessToken)
					.retrieve()
					.onStatus(status -> !status.is2xxSuccessful(), response -> {
						log.error("유저정보 조회 실패 provider=kakao status={}", response.statusCode());
						return Mono.error(new CustomException(ErrorCode.SOCIAL_LOGIN_FAILED));
					})
					.bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
					.block();

			if (body == null) {
				throw new CustomException(ErrorCode.SOCIAL_LOGIN_FAILED);
			}

			Map<String, Object> kakaoAccount = (Map<String, Object>) body.get("kakao_account");
			if (kakaoAccount == null) {
				throw new CustomException(ErrorCode.SOCIAL_LOGIN_FAILED);
			}

			Map<String, Object> profile = (Map<String, Object>) kakaoAccount.get("profile");
			String nickname = profile != null ? (String) profile.get("nickname") : null;
			String name = (String) kakaoAccount.get("name");

			if (name == null || name.isBlank()) {
				name = (nickname != null && !nickname.isBlank()) ? nickname : "카카오 사용자";
			}

			return SocialUserInfo.builder()
					.providerUserId(body.get("id").toString())
					.email((String) kakaoAccount.get("email"))
					.name(name)
					.nickname(nickname)
					.build();
		}

		private SocialUserInfo getNaverUserInfo(String accessToken) {
			Map<String, Object> body = webClient.get()
					.uri(oAuth2Properties.getNaver().getUserInfoUri())
					.header("Authorization", "Bearer " + accessToken)
					.retrieve()
					.onStatus(status -> !status.is2xxSuccessful(), response -> {
						log.error("유저정보 조회 실패 provider=naver status={}", response.statusCode());
						return Mono.error(new CustomException(ErrorCode.SOCIAL_LOGIN_FAILED));
					})
					.bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
					.block();

			if (body == null) {
				throw new CustomException(ErrorCode.SOCIAL_LOGIN_FAILED);
			}

			Map<String, Object> responseBody = (Map<String, Object>) body.get("response");
			if (responseBody == null) {
				throw new CustomException(ErrorCode.SOCIAL_LOGIN_FAILED);
			}

			return SocialUserInfo.builder()
					.providerUserId((String) responseBody.get("id"))
					.email((String) responseBody.get("email"))
					.name((String) responseBody.get("name"))
					.nickname((String) responseBody.get("nickname"))
					.build();
		}

		private SocialUserInfo getGoogleUserInfo(String accessToken) {
			Map<String, Object> body = webClient.get()
					.uri(oAuth2Properties.getGoogle().getUserInfoUri())
					.header("Authorization", "Bearer " + accessToken)
					.retrieve()
					.onStatus(status -> !status.is2xxSuccessful(), response -> {
						log.error("유저정보 조회 실패 provider=google status={}", response.statusCode());
						return Mono.error(new CustomException(ErrorCode.SOCIAL_LOGIN_FAILED));
					})
					.bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
					.block();

			if (body == null) {
				throw new CustomException(ErrorCode.SOCIAL_LOGIN_FAILED);
			}

			return SocialUserInfo.builder()
					.providerUserId((String) body.get("sub"))
					.email((String) body.get("email"))
					.name((String) body.get("name"))
					.build();
		}
	}
