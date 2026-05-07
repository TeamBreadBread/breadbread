package com.breadbread.payment.dto;

import com.breadbread.payment.entity.PaymentMethod;
import com.breadbread.payment.entity.PaymentMethodDetail;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Schema(description = "결제 준비 요청")
@Getter
@NoArgsConstructor
public class PreparePaymentRequest {

    @Schema(description = "예약 ID", example = "1")
    @NotNull
    private Long reservationId;

    @Schema(description = "포트원 결제 요청에 사용하는 결제 수단 분류값 (CARD, TRANSFER, VIRTUAL_ACCOUNT, MOBILE, EASY_PAY, GIFT_CERTIFICATE)", example = "CARD")
    @NotNull
    private PaymentMethod paymentMethod;

	@Schema(description = "예약 상세/결제 화면에 표시할 실제 결제 수단 값 (NAVER_PAY, KAKAO_PAY, TOSS_PAY, CARD, BANK_TRANSFER, MOBILE)", example = "NAVER_PAY")
	@NotNull
	private PaymentMethodDetail paymentMethodDetail;


}
