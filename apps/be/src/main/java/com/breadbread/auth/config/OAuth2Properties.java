package com.breadbread.auth.config;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.validation.annotation.Validated;

import java.util.List;

@Getter
@Setter
@Validated
@Configuration
@ConfigurationProperties(prefix = "oauth2")
public class OAuth2Properties {
	@Valid
	private Provider google = new Provider();
	@Valid
	private Provider kakao = new Provider();
	@Valid
	private Provider naver = new Provider();

	@Getter
	@Setter
	public static class Provider {
		@NotBlank
		private String clientId;
		private String clientSecret;
		@NotBlank
		private String tokenUri;
		@NotBlank
		private String userInfoUri;
		@NotEmpty
		private List<String> allowedRedirectUris;
		private boolean usePkce;
	}
}
