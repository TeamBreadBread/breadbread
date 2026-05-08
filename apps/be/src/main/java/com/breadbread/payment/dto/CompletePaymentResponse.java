package com.breadbread.payment.dto;

import com.breadbread.payment.entity.PaymentStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Getter;

@Schema(description = "결제 완료 검증 응답")
@Getter
@Builder
public class CompletePaymentResponse {

    @Schema(description = "포트원 결제 ID", example = "63acc42e-a866-4f3e-b88e-2d269386226f")
    private String paymentId;

    @Schema(description = "예약 ID", example = "1")
    private Long reservationId;

    @Schema(description = "결제 상태", example = "PAID")
    private PaymentStatus status;

    @Schema(description = "최종 결제 금액", example = "35000")
    private Long amount;

    @Schema(description = "결제 완료 시각", example = "2026-05-07T14:14:15")
    private LocalDateTime paidAt;
}
