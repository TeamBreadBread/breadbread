package com.breadbread.global.validator;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.*;

@Documented
@Constraint(validatedBy = PasswordPolicyValidator.class)
@Target({ElementType.FIELD})
@Retention(RetentionPolicy.RUNTIME)
public @interface PasswordPolicy {
    String message() default "비밀번호는 10~16자의 영문 대/소문자, 숫자 중 2종류 이상 혼합해야 하며, 3자리 이상 연속된 문자/숫자는 사용할 수 없습니다.";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}
