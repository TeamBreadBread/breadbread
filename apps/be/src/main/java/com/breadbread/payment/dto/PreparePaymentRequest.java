package com.breadbread.payment.dto;

import com.breadbread.payment.entity.PaymentMethod;
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

    @Schema(description = "결제 수단", example = "CARD")
    @NotNull
    private PaymentMethod paymentMethod;
}
