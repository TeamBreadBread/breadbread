package com.breadbread.payment.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Schema(description = "결제 완료 검증 요청")
@Getter
@NoArgsConstructor
public class CompletePaymentRequest {

    @Schema(description = "포트원 결제 ID", example = "63acc42e-a866-4f3e-b88e-2d269386226f")
    @NotBlank
    private String paymentId;
}
