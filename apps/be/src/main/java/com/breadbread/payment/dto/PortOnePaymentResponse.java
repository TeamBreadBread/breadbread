package com.breadbread.payment.dto;

import com.breadbread.payment.entity.PaymentMethod;
import com.breadbread.payment.entity.PaymentStatus;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Builder;
import lombok.Getter;

import java.time.OffsetDateTime;

@Getter
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class PortOnePaymentResponse {
	private PaymentStatus status;
	private String transactionId;
	private PaymentMethod paymentMethod;
	private Amount amount;
	private OffsetDateTime statusChangedAt;

	@Getter
	public static class Amount {
		private long total;
	}
}
