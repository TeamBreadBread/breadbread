package com.breadbread.global.validator;

import com.breadbread.global.exception.CustomException;
import com.breadbread.global.exception.ErrorCode;

public final class PaginationValidator {
    private PaginationValidator() {}

    public static void validate(int page, int size) {
        if (page < 0 || size <= 0) {
            throw new CustomException(ErrorCode.INVALID_INPUT_VALUE);
        }
    }
}
