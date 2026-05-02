package com.breadbread.auth.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Getter
@Setter
@Configuration
@ConfigurationProperties(prefix = "oauth2")
public class OAuth2Properties {
	private Provider google = new Provider();
	private Provider kakao = new Provider();
	private Provider naver = new Provider();

	@Getter
	@Setter
	public static class Provider {
		private String clientId;
		private String clientSecret;
		private String tokenUri;
		private String userInfoUri;
		private List<String> allowedRedirectUris;
		private boolean usePkce;
	}
}
