package com.breadbread.auth.dto;

import com.breadbread.user.entity.User;
import com.breadbread.user.entity.UserRole;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

//@AllArgsConstructor
@RequiredArgsConstructor
public class CustomUserDetails implements UserDetails {
    private final User user;

    @Override
    public String getUsername() {
        return user.getId().toString();
    }

    @Override
    public String getPassword() {
        return user.getPassword();
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority(user.getRole().name()));
    }

    public Long getId() {
        return user.getId();
    }

    public String getName(){
        return user.getName();
    }

    public String getNickname() {
        return user.getNickname();
    }

    public UserRole getRole() {
        return user.getRole();
    }

    @Override public boolean isEnabled() { return user.isActive(); }
    @Override public boolean isAccountNonExpired() { return true; }
    @Override public boolean isAccountNonLocked() { return true; }
    @Override public boolean isCredentialsNonExpired() { return true; }
}
