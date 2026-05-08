package com.breadbread.payment.entity;

public enum PaymentStatus {
    READY,
    PAY_PENDING,
    VIRTUAL_ACCOUNT_ISSUED,
    PAID,
    FAILED,
    CANCELLED,
    REFUNDED
}
