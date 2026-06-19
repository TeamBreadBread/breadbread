package com.breadbread.global.validation;

/** API DTO @Pattern 공통 정규식 */
public final class ValidationPatterns {

    private ValidationPatterns() {}

    /** 한글·영문 실명 (2~30자) */
    public static final String REAL_NAME = "^[a-zA-Z\\uAC00-\\uD7A3]{2,30}$";

    /** 이메일 — 도메인·TLD에 허용 문자만 */
    public static final String EMAIL = "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$";

    /** 8~16자, 영문 대/소문자·숫자·특수문자 모두 포함. 허용 특수문자는 기존 회원가입 안내와 동일. */
    public static final String ACCOUNT_PASSWORD =
            "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9])"
                    + "[A-Za-z0-9!@#$%^&*()_+\\-=\\[\\]{};':\",./<>?\\\\|`~]{8,16}$";

    public static final String ACCOUNT_PASSWORD_MESSAGE =
            "비밀번호는 8~16자이며 영문 대/소문자, 숫자, 특수문자를 모두 포함해야 합니다.";
}
