package com.breadbread.user.repository;

import com.breadbread.user.entity.UserPreference;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserPreferenceRepository extends JpaRepository<UserPreference, Long> {
    Optional<UserPreference> findByUserId(Long userId);
}
