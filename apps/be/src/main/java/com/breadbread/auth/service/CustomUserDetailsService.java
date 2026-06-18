package com.breadbread.auth.service;

import com.breadbread.auth.dto.CustomUserDetails;
import com.breadbread.global.exception.CustomException;
import com.breadbread.global.exception.ErrorCode;
import com.breadbread.user.entity.User;
import com.breadbread.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {
    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        Long userId = Long.parseLong(username);
        User user =
                userRepository
                        .findById(userId)
                        .orElseThrow(() -> new UsernameNotFoundException("User Not Found"));
        if (user.isWithdrawn()) {
            throw new CustomException(ErrorCode.WITHDRAWN_USER);
        }
        return new CustomUserDetails(user);
    }
}
