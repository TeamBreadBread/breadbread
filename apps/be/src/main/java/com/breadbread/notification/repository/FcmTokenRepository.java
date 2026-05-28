package com.breadbread.notification.repository;

import com.breadbread.notification.entity.FcmToken;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

public interface FcmTokenRepository extends JpaRepository<FcmToken, Long> {
    List<FcmToken> findAllByUserId(Long userId);

    boolean existsByUserIdAndToken(Long userId, String token);

    @Transactional
    void deleteByToken(String token);
}
