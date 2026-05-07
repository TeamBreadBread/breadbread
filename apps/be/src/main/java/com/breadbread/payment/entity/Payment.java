package com.breadbread.payment.entity;

import com.breadbread.global.entity.BaseEntity;
import com.breadbread.global.exception.CustomException;
import com.breadbread.global.exception.ErrorCode;
import com.breadbread.reservation.entity.Reservation;
import com.breadbread.user.entity.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.time.LocalDateTime;

@Entity
@Table(name = "payment")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@ToString(exclude = {"reservation", "user"})
public class Payment extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

	@Column(nullable = false, unique = true, updatable = false)
	private String paymentId;

    private String pgTransactionId;

    @Enumerated(EnumType.STRING)
	@Column(nullable = false)
    private PaymentStatus status;

	@Column(nullable = false)
	private Long originalAmount;

	@Column(nullable = false)
	private Long discountAmount;

	@Column(nullable = false)
	private Long finalAmount;

    @Enumerated(EnumType.STRING)
	@Column(nullable = false)
    private PaymentMethod paymentMethod;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private PaymentMethodDetail paymentMethodDetail;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private PgProvider pgProvider;

    private LocalDateTime paidAt;
    private LocalDateTime cancelledAt;
    private LocalDateTime refundedAt;
	private String failReason;

    @ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "reservation_id", nullable = false)
    private Reservation reservation;

    @Builder
    public Payment(String paymentId, Long originalAmount,
				   Long discountAmount, Long finalAmount,
				   PaymentMethod paymentMethod,
				   PaymentMethodDetail paymentMethodDetail,
				   PgProvider pgProvider,
				   User user, Reservation reservation) {
		this.paymentId = paymentId;
        this.status  = PaymentStatus.READY;
		this.originalAmount = originalAmount;
		this.discountAmount = discountAmount;
		this.finalAmount = finalAmount;
        this.paymentMethod = paymentMethod;
		this.paymentMethodDetail = paymentMethodDetail;
		this.pgProvider = pgProvider;
        this.user = user;
        this.reservation = reservation;
    }

	public void markPayPending() {
		if (this.status != PaymentStatus.READY) {
			throw new CustomException(ErrorCode.PAYMENT_STATUS_CHANGE_NOT_ALLOWED);
		}
		this.status = PaymentStatus.PAY_PENDING;
	}

	public void markVirtualAccountIssued() {
		if (this.status != PaymentStatus.READY && this.status != PaymentStatus.PAY_PENDING) {
			throw new CustomException(ErrorCode.PAYMENT_STATUS_CHANGE_NOT_ALLOWED);
		}
		this.status = PaymentStatus.VIRTUAL_ACCOUNT_ISSUED;
	}

	public void markPaid(String pgTransactionId, LocalDateTime paidAt) {
		if (this.status == PaymentStatus.PAID) {
			throw new CustomException(ErrorCode.PAYMENT_ALREADY_DONE);
		}
		if (this.status == PaymentStatus.CANCELLED) {
			throw new CustomException(ErrorCode.PAYMENT_ALREADY_CANCELLED);
		}
		if (this.status == PaymentStatus.REFUNDED) {
			throw new CustomException(ErrorCode.PAYMENT_ALREADY_REFUNDED);
		}
		if (this.status != PaymentStatus.READY
			&& this.status != PaymentStatus.PAY_PENDING
			&& this.status != PaymentStatus.VIRTUAL_ACCOUNT_ISSUED) {
			throw new CustomException(ErrorCode.PAYMENT_STATUS_CHANGE_NOT_ALLOWED);
		}

		this.status = PaymentStatus.PAID;
		this.pgTransactionId = pgTransactionId;
		this.paidAt = paidAt;
		this.failReason = null;
	}

	public void markFailed(String failReason) {
		if (this.status == PaymentStatus.PAID) {
			throw new CustomException(ErrorCode.PAYMENT_ALREADY_DONE);
		}
		if (this.status == PaymentStatus.CANCELLED) {
			throw new CustomException(ErrorCode.PAYMENT_ALREADY_CANCELLED);
		}
		if (this.status == PaymentStatus.REFUNDED) {
			throw new CustomException(ErrorCode.PAYMENT_ALREADY_REFUNDED);
		}
		if (this.status != PaymentStatus.READY
			&& this.status != PaymentStatus.PAY_PENDING
			&& this.status != PaymentStatus.VIRTUAL_ACCOUNT_ISSUED) {
			throw new CustomException(ErrorCode.PAYMENT_STATUS_CHANGE_NOT_ALLOWED);
		}

		this.status = PaymentStatus.FAILED;
		this.failReason = failReason;
	}

	public void markCancelled() {
		if (this.status == PaymentStatus.CANCELLED) {
			throw new CustomException(ErrorCode.PAYMENT_ALREADY_CANCELLED);
		}
		if (this.status == PaymentStatus.REFUNDED) {
			throw new CustomException(ErrorCode.PAYMENT_ALREADY_REFUNDED);
		}
		if (this.status != PaymentStatus.PAID && this.status != PaymentStatus.VIRTUAL_ACCOUNT_ISSUED) {
			throw new CustomException(ErrorCode.PAYMENT_STATUS_CHANGE_NOT_ALLOWED);
		}

		this.status = PaymentStatus.CANCELLED;
		this.cancelledAt = LocalDateTime.now();
	}

	public void markRefunded() {
		if (this.status == PaymentStatus.REFUNDED) {
			throw new CustomException(ErrorCode.PAYMENT_ALREADY_REFUNDED);
		}
		if (this.status == PaymentStatus.CANCELLED) {
			throw new CustomException(ErrorCode.PAYMENT_ALREADY_CANCELLED);
		}
		if (this.status != PaymentStatus.PAID) {
			throw new CustomException(ErrorCode.PAYMENT_STATUS_CHANGE_NOT_ALLOWED);
		}

		this.status = PaymentStatus.REFUNDED;
		this.refundedAt = LocalDateTime.now();
	}
}
