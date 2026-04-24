package com.breadbread.auth.repository;

import com.breadbread.auth.entity.PhoneVerification;
import com.breadbread.auth.entity.VerificationPurpose;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PhoneVerificationRepository extends JpaRepository<PhoneVerification, Long> {
    Optional<PhoneVerification> findByPhoneAndPurpose(String phone, VerificationPurpose purpose);
    void deleteByPhoneAndPurpose(String phone, VerificationPurpose purpose);
}
