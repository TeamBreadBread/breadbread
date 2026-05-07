package com.breadbread.payment.dto;

import com.breadbread.payment.entity.Payment;
import com.breadbread.payment.entity.PaymentMethod;
import com.breadbread.payment.entity.PgProvider;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;

@Schema(description = "결제 준비 응답 - 포트원 SDK 초기화에 필요한 정보")
@Getter
@Builder
public class PreparePaymentResponse {

    @Schema(description = "포트원 결제 ID (UUID)", example = "63acc42e-a866-4f3e-b88e-2d269386226f")
    private String paymentId;

    @Schema(description = "주문명 (결제창에 표시)", example = "성심당 코스 빵빵 택시 예약 결제")
    private String orderName;

    @Schema(description = "결제 금액", example = "35000")
    private Long amount;

    @Schema(description = "결제 수단", example = "CARD")
    private PaymentMethod paymentMethod;

    @Schema(description = "PG사", example = "TOSS_PAYMENT")
    private PgProvider pgProvider;

    @Schema(description = "고객 이름 (포트원 SDK 초기화용)", example = "홍길동")
    private String customerName;

    @Schema(description = "고객 전화번호 (포트원 SDK 초기화용)", example = "010-1234-5678")
    private String customerPhone;

	public static PreparePaymentResponse from(Payment payment){
		return PreparePaymentResponse.builder()
			.paymentId(payment.getPaymentId())
			.orderName(payment.getReservation().getCourseNameSnapshot() + " 빵빵 택시 예약 결제")
			.amount(payment.getFinalAmount())
			.paymentMethod(payment.getPaymentMethod())
			.pgProvider(payment.getPgProvider())
			.customerName(payment.getUser().getName())
			.customerPhone(payment.getUser().getPhone())
			.build();
	}
}
