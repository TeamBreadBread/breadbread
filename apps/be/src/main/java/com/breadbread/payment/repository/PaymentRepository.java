package com.breadbread.payment.repository;

import com.breadbread.payment.entity.Payment;
import com.breadbread.payment.entity.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
	Optional<Payment> findByPaymentId(String paymentId);
	Optional<Payment> findTopByReservationIdAndStatusOrderByPaidAtDesc(Long reservationId, PaymentStatus status);
}
