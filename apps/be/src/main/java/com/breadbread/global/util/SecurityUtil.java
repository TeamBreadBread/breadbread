package com.breadbread.global.util;


import com.breadbread.auth.dto.CustomUserDetails;
import com.breadbread.global.exception.CustomException;
import com.breadbread.global.exception.ErrorCode;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public class SecurityUtil {
    public static CustomUserDetails getCurrentUser(){
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if(authentication == null || !(authentication.getPrincipal() instanceof CustomUserDetails)){
            throw new CustomException(ErrorCode.UNAUTHORIZED);
        }
        return (CustomUserDetails) authentication.getPrincipal();
    }
}
