package com.breadbread.payment.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Getter
@Setter
@Configuration
@ConfigurationProperties(prefix = "portone")
public class PortOneProperties {
	private String apiBaseUrl;
	private String apiSecret;
	private String storeId;
	private String channelKey;
	private String webhookSecret;
}
