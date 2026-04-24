package com.breadbread.global.validator;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class PasswordPolicyValidator implements ConstraintValidator<PasswordPolicy, String> {

    private static final String[] KEYBOARD_SEQUENCES = {
            "qwertyuiop", "asdfghjkl", "zxcvbnm",   // 키보드 가로줄
            "abcdefghijklmnopqrstuvwxyz",            // 알파벳 순서
            "0123456789"                             // 숫자 순서
    };

    private static final int MIN_LENGTH = 10;
    private static final int MAX_LENGTH = 16;

    @Override
    public boolean isValid(String password, ConstraintValidatorContext context) {
        if (password == null || password.isBlank()) return true; // @NotBlank가 처리

        // 길이 제한
        if (password.length() < MIN_LENGTH || password.length() > MAX_LENGTH) {
            return fail(context, "비밀번호는 " + MIN_LENGTH + "~" + MAX_LENGTH + "자여야 합니다.");
        }

        // 특수문자 불가 (영문 대/소문자, 숫자만 허용)
        if (!password.matches("^[A-Za-z0-9]+$")) {
            return fail(context, "비밀번호는 영문 대/소문자, 숫자만 사용 가능합니다.");
        }

        // 영문 대문자, 소문자, 숫자 중 2종류 이상 혼합
        boolean hasUpper = password.chars().anyMatch(Character::isUpperCase);
        boolean hasLower = password.chars().anyMatch(Character::isLowerCase);
        boolean hasDigit = password.chars().anyMatch(Character::isDigit);
        int typeCount = (hasUpper ? 1 : 0) + (hasLower ? 1 : 0) + (hasDigit ? 1 : 0);
        if (typeCount < 2) {
            return fail(context, "비밀번호는 영문 대/소문자, 숫자 중 2종류 이상 혼합해야 합니다.");
        }

        // 3자리 연속 키보드 문자/숫자 제한
        if (hasConsecutiveSequence(password)) {
            return fail(context, "3자리 이상 연속된 문자/숫자는 사용할 수 없습니다.");
        }

        return true;
    }

    private boolean fail(ConstraintValidatorContext context, String message) {
        context.disableDefaultConstraintViolation();
        context.buildConstraintViolationWithTemplate(message).addConstraintViolation();
        return false;
    }

    private boolean hasConsecutiveSequence(String password) {
        String lower = password.toLowerCase();
        for (String sequence : KEYBOARD_SEQUENCES) {
            for (int i = 0; i <= sequence.length() - 3; i++) {
                String substring = sequence.substring(i, i + 3);
                String reversed = new StringBuilder(substring).reverse().toString();
                if (lower.contains(substring) || lower.contains(reversed)) {
                    return true;
                }
            }
        }
        return false;
    }
}
