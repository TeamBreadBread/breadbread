package com.breadbread.global.util;

/** 외부 응답 등 사용자·서드파티 제공 문자열을 로그에 남길 때 사용 (log injection·과다 노출 완화). */
public final class LogRedaction {

    private LogRedaction() {}

    public static String forLog(String value) {
        return forLog(value, 200);
    }

    public static String forLog(String value, int maxLength) {
        if (value == null) {
            return "";
        }
        String sanitized = value.replace('\r', ' ').replace('\n', ' ').strip();
        if (maxLength <= 0 || sanitized.length() <= maxLength) {
            return sanitized;
        }
        return sanitized.substring(0, maxLength) + "…";
    }
}
