/** 회원가입·비밀번호 변경 공통 — 한글/영문 실명 (2~30자) */
const SIGNUP_NAME_PATTERN = /^[a-zA-Z가-힣]{2,30}$/;

/** 도메인·TLD에 허용 문자만 (abc111@!.! 등 차단) */
const SIGNUP_EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export function isValidSignupName(value: string): boolean {
  return SIGNUP_NAME_PATTERN.test(value.trim());
}

export function isValidSignupEmail(value: string): boolean {
  return SIGNUP_EMAIL_PATTERN.test(value.trim());
}

/** 8~16자, 영문 대/소문자·숫자·특수문자 모두 포함 */
export function isValidAccountPassword(value: string): boolean {
  return (
    value.length >= 8 &&
    value.length <= 16 &&
    /[a-z]/.test(value) &&
    /[A-Z]/.test(value) &&
    /[0-9]/.test(value) &&
    /[^a-zA-Z0-9]/.test(value)
  );
}

export function getAccountPasswordValidationMessage(password: string): string {
  if (!password) return "8~16자의 영문 대/소문자, 숫자, 특수문자를 사용해 주세요.";
  if (password.length < 8 || password.length > 16) {
    return "비밀번호를 8자 이상 16자 이하로 입력해주세요.";
  }
  if (!/[^a-zA-Z0-9]/.test(password)) {
    return "비밀번호에 특수문자를 포함해주세요.";
  }
  if (!/[0-9]/.test(password)) {
    return "비밀번호에 숫자를 포함해주세요.";
  }
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password)) {
    return "영문 대/소문자, 숫자, 특수문자를 모두 포함해야 합니다.";
  }
  return "사용할 수 있는 비밀번호입니다.";
}
