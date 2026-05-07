package com.breadbread.global.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum ErrorCode {

	// 공통 E00xx
	INVALID_INPUT_VALUE(HttpStatus.BAD_REQUEST, "E0001", "잘못된 입력값입니다."),
	UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "E0002", "접근 권한이 없습니다."),
	FORBIDDEN(HttpStatus.FORBIDDEN, "E0003", "권한이 없습니다."),
	NOT_FOUND(HttpStatus.NOT_FOUND, "E0004", "존재하지 않는 리소스입니다."),
	INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "E0005", "서버 오류가 발생했습니다."),
	FEATURE_NOT_IMPLEMENTED(HttpStatus.NOT_IMPLEMENTED, "E0006", "아직 구현되지 않은 기능입니다."),
	TOO_MANY_REQUESTS(HttpStatus.TOO_MANY_REQUESTS, "E0007", "요청이 너무 많습니다. 잠시 후 다시 시도해주세요."),

	// 회원/인증 E01xx
    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "E0101", "존재하지 않는 사용자입니다."),
    DUPLICATE_LOGIN_ID(HttpStatus.CONFLICT, "E0102", "이미 사용 중인 아이디입니다."),
    INVALID_LOGIN_ID(HttpStatus.UNAUTHORIZED, "E0103","아이디가 일치하지 않습니다."),
    INVALID_PASSWORD(HttpStatus.UNAUTHORIZED, "E0104", "비밀번호가 일치하지 않습니다."),
    INVALID_VERIFICATION_CODE(HttpStatus.BAD_REQUEST, "E0105", "인증번호가 일치하지 않습니다."),
    VERIFICATION_EXPIRED(HttpStatus.BAD_REQUEST, "E0106", "인증 토큰이 만료되었습니다."),
    VERIFICATION_PURPOSE_MISMATCH(HttpStatus.BAD_REQUEST, "E0107", "인증 목적이 일치하지 않습니다."),
    PASSWORD_MISMATCH(HttpStatus.BAD_REQUEST, "E0108", "비밀번호와 비밀번호 확인이 일치하지 않습니다."),
    PHONE_VERIFICATION_MISMATCH(HttpStatus.BAD_REQUEST, "E0109", "전화번호와 인증 토큰이 일치하지 않습니다."),
    USER_INFO_MISMATCH(HttpStatus.BAD_REQUEST, "E0110", "사용자 정보가 일치하지 않습니다."),
    VERIFICATION_NOT_FOUND(HttpStatus.NOT_FOUND, "E0111", "인증 정보가 존재하지 않습니다."),
    ALREADY_VERIFIED(HttpStatus.BAD_REQUEST, "E0112", "이미 인증된 전화번호입니다."),
	SOCIAL_LOGIN_FAILED(HttpStatus.UNAUTHORIZED, "E0113", "소셜 로그인에 실패했습니다."),
	DUPLICATE_PHONE(HttpStatus.CONFLICT, "E0114", "이미 가입된 전화번호입니다."),
	INVALID_SOCIAL_STATE(HttpStatus.BAD_REQUEST, "E0115", "유효하지 않은 소셜 로그인 state입니다."),

    // 토큰 E02xx
    INVALID_TOKEN(HttpStatus.UNAUTHORIZED, "E0201", "유효하지 않은 토큰입니다."),
    EXPIRED_TOKEN(HttpStatus.UNAUTHORIZED, "E0202", "만료된 토큰입니다."),
    REFRESH_TOKEN_NOT_FOUND(HttpStatus.UNAUTHORIZED, "E0203", "리프레시 토큰이 존재하지 않습니다."),

    // 빵집 E03xx
    BAKERY_NOT_FOUND(HttpStatus.NOT_FOUND, "E0301", "존재하지 않는 빵집입니다."),
    MENU_NOT_FOUND(HttpStatus.NOT_FOUND, "E0302", "존재하지 않는 메뉴입니다."),
    REVIEW_NOT_FOUND(HttpStatus.NOT_FOUND, "E0303", "존재하지 않는 리뷰입니다."),
    ALREADY_LIKED(HttpStatus.CONFLICT, "E0304", "이미 좋아요한 빵집입니다."),
    NOT_LIKED(HttpStatus.BAD_REQUEST, "E0305", "좋아요하지 않은 빵집입니다."),

    // 코스/AI추천 E04xx
    COURSE_NOT_FOUND(HttpStatus.NOT_FOUND, "E0401", "존재하지 않는 코스입니다."),
    AI_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "E0402", "AI 추천 서버 오류가 발생했습니다."),
    PREFERENCE_NOT_FOUND(HttpStatus.NOT_FOUND, "E0403", "선호도 조사 결과가 없습니다."),
    PREFERENCE_ALREADY_EXISTS(HttpStatus.CONFLICT, "E0410", "이미 선호도 조사를 완료했습니다."),
    NOT_AI_COURSE(HttpStatus.BAD_REQUEST, "E0404", "AI 코스에서만 사용할 수 있는 기능입니다."),
    COURSE_BAKERY_REQUIRED(HttpStatus.BAD_REQUEST, "E0405", "코스에 빵집이 최소 1개 이상 필요합니다."),
    ALREADY_COURSE_LIKED(HttpStatus.CONFLICT, "E0406", "이미 좋아요한 코스입니다."),
    NOT_COURSE_LIKED(HttpStatus.BAD_REQUEST, "E0407", "좋아요하지 않은 코스입니다."),
    ALREADY_ROUTED(HttpStatus.CONFLICT, "E0408", "이미 저장한 코스입니다."),
    NOT_ROUTED(HttpStatus.BAD_REQUEST, "E0409", "저장하지 않은 코스입니다."),
    AI_JOB_NOT_FOUND(HttpStatus.NOT_FOUND, "E0411", "존재하지 않는 AI 작업입니다."),

    // 예약 E05xx
    RESERVATION_NOT_FOUND(HttpStatus.NOT_FOUND, "E0501", "존재하지 않는 예약입니다."),
    ALREADY_RESERVED(HttpStatus.CONFLICT, "E0502", "이미 예약된 시간입니다."),
    INVALID_RESERVATION_TIME(HttpStatus.BAD_REQUEST, "E0503", "유효하지 않은 예약 시간입니다."),
    RESERVATION_CANCEL_FAILED(HttpStatus.BAD_REQUEST, "E0504", "예약 취소가 불가능합니다."),
	RESERVATION_ALREADY_CANCELLED(HttpStatus.BAD_REQUEST, "E0505", "이미 취소된 예약입니다."),
	RESERVATION_NOT_MODIFIABLE(HttpStatus.CONFLICT,"E0506","현재 상태에서는 예약을 변경할 수 없습니다."),
	RESERVATION_ALREADY_CONFIRMED(HttpStatus.BAD_REQUEST, "E0507", "이미 확정된 예약입니다."),
	RESERVATION_CONFIRM_FAILED(HttpStatus.BAD_REQUEST, "E0508", "예약 확정이 불가능합니다."),

    // 결제 E06xx
    PAYMENT_NOT_FOUND(HttpStatus.NOT_FOUND, "E0601", "존재하지 않는 결제 내역입니다."),
    PAYMENT_FAILED(HttpStatus.BAD_REQUEST, "E0602", "결제에 실패했습니다."),
    PAYMENT_ALREADY_DONE(HttpStatus.CONFLICT, "E0603", "이미 완료된 결제입니다."),
    PAYMENT_CANCEL_FAILED(HttpStatus.BAD_REQUEST, "E0604", "결제 취소에 실패했습니다."),
	PAYMENT_ALREADY_CANCELLED(HttpStatus.BAD_REQUEST, "E0605", "이미 취소된 결제입니다."),
	PAYMENT_ALREADY_REFUNDED(HttpStatus.BAD_REQUEST, "E0606", "이미 환불된 결제입니다."),
	PAYMENT_STATUS_CHANGE_NOT_ALLOWED(HttpStatus.BAD_REQUEST, "E0607", "현재 결제 상태에서는 요청한 변경이 불가능합니다."),

	// 파일/GCS E07xx
    FILE_UPLOAD_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "E0701", "파일 업로드에 실패했습니다."),
    FILE_DELETE_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "E0702", "파일 삭제에 실패했습니다."),
    INVALID_FILE_NAME(HttpStatus.BAD_REQUEST, "E0703", "유효하지 않은 파일 이름입니다."),
    INVALID_GCS_URL(HttpStatus.BAD_REQUEST, "E0704", "유효하지 않은 파일 URL입니다."),
    INVALID_FILE_TYPE(HttpStatus.BAD_REQUEST, "E0705", "허용되지 않는 파일 형식입니다. (jpeg, jpg, png, webp만 가능)");

    private final HttpStatus status;
    private final String code;
    private final String message;
}
