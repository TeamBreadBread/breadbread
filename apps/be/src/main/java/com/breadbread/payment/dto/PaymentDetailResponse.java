package com.breadbread.payment.dto;

import com.breadbread.payment.entity.Payment;
import com.breadbread.payment.entity.PaymentMethod;
import com.breadbread.payment.entity.PaymentStatus;
import com.breadbread.payment.entity.PgProvider;
import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class PaymentDetailResponse {

    private String paymentId;
    private Long reservationId;
    private PaymentStatus status;
    private PaymentMethod paymentMethod;
    private PgProvider pgProvider;
    private Long originalAmount;
    private Long discountAmount;
    private Long finalAmount;
    private String pgTransactionId;
    private String failReason;
    private LocalDateTime paidAt;
    private LocalDateTime cancelledAt;
    private LocalDateTime refundedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static PaymentDetailResponse from(Payment payment) {
        return PaymentDetailResponse.builder()
                .paymentId(payment.getPaymentId())
                .reservationId(payment.getReservation().getId())
                .status(payment.getStatus())
                .paymentMethod(payment.getPaymentMethod())
                .pgProvider(payment.getPgProvider())
                .originalAmount(payment.getOriginalAmount())
                .discountAmount(payment.getDiscountAmount())
                .finalAmount(payment.getFinalAmount())
                .pgTransactionId(payment.getPgTransactionId())
                .failReason(payment.getFailReason())
                .paidAt(payment.getPaidAt())
                .cancelledAt(payment.getCancelledAt())
                .refundedAt(payment.getRefundedAt())
                .createdAt(payment.getCreatedAt())
                .updatedAt(payment.getUpdatedAt())
                .build();
    }
}
