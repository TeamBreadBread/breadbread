import { apiClient, extractData } from "@/api/client";
import type { ApiEnvelope } from "@/api/types/common";

const PATH = "/auth";

export type TokenResponse = {
  accessToken: string;
  refreshToken: string;
};

export type LoginRequest = {
  loginId: string;
  password: string;
};

export type TokenRequestBody = {
  refreshToken: string;
};

/** 백엔드 `UserRole` */
export type UserRole =
  | "ROLE_USER"
  | "ROLE_ADMIN"
  | "ROLE_BUSINESS"
  | "ROLE_DRIVER"
  | "USER"
  | "ADMIN"
  | "BUSINESS"
  | "DRIVER";

export type SignupRequest = {
  loginId: string;
  password: string;
  passwordConfirm: string;
  name: string;
  email: string;
  phone: string;
  role?: UserRole;
  termsAgreed: boolean;
  privacyAgreed: boolean;
  verificationToken: string;
};

function toBackendRole(
  role: UserRole | undefined,
): "ROLE_USER" | "ROLE_ADMIN" | "ROLE_BUSINESS" | "ROLE_DRIVER" | undefined {
  if (!role) return undefined;
  switch (role) {
    case "USER":
    case "ROLE_USER":
      return "ROLE_USER";
    case "ADMIN":
    case "ROLE_ADMIN":
      return "ROLE_ADMIN";
    case "BUSINESS":
    case "ROLE_BUSINESS":
      return "ROLE_BUSINESS";
    case "DRIVER":
    case "ROLE_DRIVER":
      return "ROLE_DRIVER";
  }
}

export type CheckIdResponse = {
  available: boolean;
};

export type FindIdRequest = {
  name: string;
  phone: string;
  verificationToken: string;
};

export type FindIdResponse = {
  loginId: string;
};

export type FindPwRequest = {
  loginId: string;
  name: string;
  phone: string;
  verificationToken: string;
};

export type ResetPwRequest = {
  newPassword: string;
  newPasswordConfirm: string;
  verificationToken: string;
};

/** `AuthType` */
export type AuthType = "SMS" | "PASS";

/** `VerificationPurpose` */
export type VerificationPurpose = "SIGNUP" | "FIND_ID" | "FIND_PW";

export type SendPhoneRequest = {
  phone: string;
  authType?: AuthType;
  purpose: VerificationPurpose;
};

export type VerifyPhoneRequest = {
  phone: string;
  code: string;
  purpose: VerificationPurpose;
};

export type VerifyPhoneResponse = {
  verificationToken: string;
};

/** `SsoProvider` */
export type SsoProvider = "GOOGLE" | "KAKAO" | "NAVER";

export type SocialLoginRequest = {
  code: string;
  redirectUri: string;
  codeVerifier?: string;
  state?: string;
};

export const SESSION_ACCESS_KEY = "breadbread_access_token";
export const SESSION_REFRESH_KEY = "breadbread_refresh_token";

export function setSessionTokens(tokens: TokenResponse): void {
  localStorage.setItem(SESSION_ACCESS_KEY, tokens.accessToken);
  localStorage.setItem(SESSION_REFRESH_KEY, tokens.refreshToken);
}

export function clearSessionTokens(): void {
  localStorage.removeItem(SESSION_ACCESS_KEY);
  localStorage.removeItem(SESSION_REFRESH_KEY);
}

export async function signup(body: SignupRequest): Promise<void> {
  const payload: SignupRequest = {
    ...body,
    role: toBackendRole(body.role),
  };
  const { data } = await apiClient.post<ApiEnvelope<void>>(`${PATH}/signup`, payload);
  extractData(data);
}

export async function login(body: LoginRequest): Promise<TokenResponse> {
  const { data } = await apiClient.post<ApiEnvelope<TokenResponse>>(`${PATH}/login`, body);
  return extractData(data);
}

export async function logout(): Promise<void> {
  const { data } = await apiClient.post<ApiEnvelope<void>>(`${PATH}/logout`);
  extractData(data);
}

export async function refresh(body: TokenRequestBody): Promise<TokenResponse> {
  const { data } = await apiClient.post<ApiEnvelope<TokenResponse>>(`${PATH}/refresh`, body);
  return extractData(data);
}

export async function checkId(loginId: string): Promise<CheckIdResponse> {
  const { data } = await apiClient.get<ApiEnvelope<CheckIdResponse>>(`${PATH}/check-id`, {
    params: { loginId },
  });
  return extractData(data);
}

export async function findId(body: FindIdRequest): Promise<FindIdResponse> {
  const { data } = await apiClient.post<ApiEnvelope<FindIdResponse>>(`${PATH}/find-id`, body);
  return extractData(data);
}

export async function findPw(body: FindPwRequest): Promise<void> {
  const { data } = await apiClient.post<ApiEnvelope<void>>(`${PATH}/find-pw`, body);
  extractData(data);
}

export async function resetPw(body: ResetPwRequest): Promise<void> {
  const { data } = await apiClient.patch<ApiEnvelope<void>>(`${PATH}/reset-pw`, body);
  extractData(data);
}

export async function sendPhone(body: SendPhoneRequest): Promise<void> {
  const { data } = await apiClient.post<ApiEnvelope<void>>(`${PATH}/phone/send`, body);
  extractData(data);
}

export async function verifyPhone(body: VerifyPhoneRequest): Promise<VerifyPhoneResponse> {
  const { data } = await apiClient.post<ApiEnvelope<VerifyPhoneResponse>>(
    `${PATH}/phone/verify`,
    body,
  );
  return extractData(data);
}

export async function socialLogin(
  provider: SsoProvider,
  body: SocialLoginRequest,
): Promise<TokenResponse> {
  const { data } = await apiClient.post<ApiEnvelope<TokenResponse>>(
    `${PATH}/social/${provider}`,
    body,
  );
  return extractData(data);
}
