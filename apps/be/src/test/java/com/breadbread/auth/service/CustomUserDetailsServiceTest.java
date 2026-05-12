package com.breadbread.auth.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import com.breadbread.auth.dto.CustomUserDetails;
import com.breadbread.user.entity.User;
import com.breadbread.user.entity.UserRole;
import com.breadbread.user.repository.UserRepository;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class CustomUserDetailsServiceTest {

    @Mock private UserRepository userRepository;

    @InjectMocks private CustomUserDetailsService customUserDetailsService;

    @Test
    void loadUserByUsername_returns_details_when_user_exists() {
        User user = user(7L);
        when(userRepository.findById(7L)).thenReturn(Optional.of(user));

        CustomUserDetails details =
                (CustomUserDetails) customUserDetailsService.loadUserByUsername("7");

        assertThat(details.getId()).isEqualTo(7L);
        assertThat(details.getUsername()).isEqualTo("7");
        assertThat(details.getPassword()).isEqualTo("encoded");
        assertThat(details.getAuthorities())
                .extracting(GrantedAuthority::getAuthority)
                .containsExactly(UserRole.ROLE_USER.name());
        assertThat(details.isEnabled()).isTrue();
        assertThat(details.getName()).isEqualTo("이름");
        assertThat(details.getNickname()).isEqualTo("nick");
        assertThat(details.getRole()).isEqualTo(UserRole.ROLE_USER);
    }

    @Test
    void loadUserByUsername_throws_when_user_missing() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> customUserDetailsService.loadUserByUsername("99"))
                .isInstanceOf(UsernameNotFoundException.class)
                .hasMessageContaining("User Not Found");
    }

    @Test
    void loadUserByUsername_reflects_disabled_when_user_inactive() {
        User user = user(3L);
        ReflectionTestUtils.setField(user, "active", false);
        when(userRepository.findById(3L)).thenReturn(Optional.of(user));

        CustomUserDetails details =
                (CustomUserDetails) customUserDetailsService.loadUserByUsername("3");

        assertThat(details.isEnabled()).isFalse();
    }

    private static User user(long id) {
        User user =
                User.builder()
                        .loginId("u" + id)
                        .password("encoded")
                        .name("이름")
                        .nickname("nick")
                        .email(id + "@t.com")
                        .phone("0100000" + String.format("%04d", id))
                        .role(UserRole.ROLE_USER)
                        .termsAgreed(true)
                        .privacyAgreed(true)
                        .build();
        ReflectionTestUtils.setField(user, "id", id);
        return user;
    }
}
