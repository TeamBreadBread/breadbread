package com.breadbread.auth.repository;

import com.breadbread.auth.entity.SsoAccount;
import com.breadbread.auth.entity.SsoProvider;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SsoAccountRepository extends JpaRepository<SsoAccount, Long> {
    Optional<SsoAccount> findByProviderAndProviderUserId(SsoProvider provider, String providerUserId);
}
