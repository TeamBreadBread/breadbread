package com.breadbread.reservation.dto;

import com.breadbread.payment.entity.Payment;
import com.breadbread.payment.entity.PaymentMethod;
import com.breadbread.payment.entity.PaymentMethodDetail;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class ReservationPaymentInfo {
	private PaymentMethodDetail paymentMethodDetail;
	private Long amount;
	private LocalDateTime paidAt;

	public static ReservationPaymentInfo from(Payment payment) {
		return ReservationPaymentInfo.builder()
			.paymentMethodDetail(payment.getPaymentMethodDetail())
			.amount(payment.getFinalAmount())
			.paidAt(payment.getPaidAt())
			.build();
	}
}
