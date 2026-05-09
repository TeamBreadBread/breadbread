package com.breadbread.payment.repository;

import com.breadbread.payment.entity.Payment;
import com.breadbread.payment.entity.PaymentStatus;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findByPaymentId(String paymentId);

    Optional<Payment> findTopByReservationIdAndStatusOrderByPaidAtDesc(
            Long reservationId, PaymentStatus status);

    boolean existsByReservationIdAndStatus(Long reservationId, PaymentStatus status);
}
