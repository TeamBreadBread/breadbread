package com.breadbread.notification.repository;

import com.breadbread.notification.entity.FcmToken;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FcmTokenRepository extends JpaRepository<FcmToken, Long> {
    List<FcmToken> findAllByUserId(Long userId);

    boolean existsByUserIdAndToken(Long userId, String token);

    void deleteByToken(String token);

    void deleteAllByUserId(Long userId);
}
