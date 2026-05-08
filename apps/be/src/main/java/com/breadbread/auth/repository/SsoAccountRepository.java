package com.breadbread.auth.repository;

import com.breadbread.auth.entity.SsoAccount;
import com.breadbread.auth.entity.SsoProvider;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SsoAccountRepository extends JpaRepository<SsoAccount, Long> {
    Optional<SsoAccount> findByProviderAndProviderUserId(
            SsoProvider provider, String providerUserId);
}
