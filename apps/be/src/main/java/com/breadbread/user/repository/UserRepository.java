package com.breadbread.user.repository;

import com.breadbread.user.entity.User;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByLoginId(String loginId);

    Optional<User> findByLoginIdIgnoreCase(String loginId);

    Optional<User> findByPhone(String phone);

    boolean existsByLoginId(String loginId);

    boolean existsByLoginIdIgnoreCase(String loginId);

    boolean existsByNickname(String nickname);

    boolean existsByPhone(String phone);
}
