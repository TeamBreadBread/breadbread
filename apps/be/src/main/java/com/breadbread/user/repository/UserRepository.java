package com.breadbread.user.repository;

import com.breadbread.user.entity.User;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByLoginId(String loginId);
    Optional<User> findByPhone(String phone);
    boolean existsByLoginId(String loginId);
    boolean existsByNickname(String nickname);
	boolean existsByPhone( String phone);
}
