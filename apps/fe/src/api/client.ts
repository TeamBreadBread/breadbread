import axios, { type AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";

import { ApiBusinessError, type ApiEnvelope, unwrapApiBody } from "@/api/types/common";

/** 빌드 시 `VITE_API_BASE_URL` 가 있으면 최우선 사용 */
const envBase = import.meta.env.VITE_API_BASE_URL;

function resolveBaseUrl(): string {
  if (typeof envBase === "string" && envBase.trim() !== "") {
    return envBase.trim();
  }

  // Firebase Hosting(web.app/firebaseapp.com) 배포는 리라이트로 same-origin 경유 시 CORS 이슈를 피할 수 있습니다.
  if (typeof window !== "undefined") {
    const host = window.location.hostname.toLowerCase();
    if (host.endsWith(".web.app") || host.endsWith(".firebaseapp.com")) {
      return "";
    }
  }

  // 그 외 프로덕션은 API 서브도메인을 기본값으로 사용합니다.
  if (import.meta.env.PROD) {
    return "https://api.breadbread.io";
  }

  return "";
}

const baseURL = resolveBaseUrl();

export const apiClient = axios.create({
  baseURL,
  // 인증 플로우(SMS/로그인)가 느린 환경에서도 너무 빨리 끊기지 않도록 여유를 둡니다.
  timeout: 60_000,
  headers: {
    "Content-Type": "application/json",
  },
});

let accessTokenGetter: () => string | null | undefined = () => {
  if (typeof localStorage === "undefined") {
    return undefined;
  }
  return localStorage.getItem("breadbread_access_token");
};

/**
 * 인증이 필요한 요청에 붙일 액세스 토큰을 반환하는 함수를 등록합니다.
 * (예: Zustand, React Context 등)
 */
export function setAccessTokenGetter(getter: () => string | null | undefined): void {
  accessTokenGetter = getter;
}

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = accessTokenGetter?.();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }
  return config;
});

function businessErrorFromEnvelope(
  envelope: ApiEnvelope | undefined,
  status: number | undefined,
  fallbackMessage: string,
): ApiBusinessError {
  if (envelope?.success === false && envelope.error?.message) {
    return new ApiBusinessError(envelope.error.message, envelope.error.code, status);
  }
  return new ApiBusinessError(fallbackMessage, undefined, status);
}

apiClient.interceptors.response.use(
  (response: AxiosResponse<ApiEnvelope>) => {
    const envelope = response.data as ApiEnvelope | undefined;
    if (envelope?.success === false) {
      return Promise.reject(
        businessErrorFromEnvelope(
          envelope,
          response.status,
          envelope.error?.message ?? "요청에 실패했습니다.",
        ),
      );
    }
    return response;
  },
  (error: AxiosError<ApiEnvelope>) => {
    const status = error.response?.status;
    const envelope = error.response?.data;
    if (envelope && envelope.success === false) {
      return Promise.reject(
        businessErrorFromEnvelope(
          envelope,
          status,
          envelope.error?.message ?? "요청 처리 중 오류가 발생했습니다.",
        ),
      );
    }
    if (!error.response) {
      return Promise.reject(
        new ApiBusinessError(error.message || "네트워크 오류가 발생했습니다.", undefined),
      );
    }
    return Promise.reject(
      new ApiBusinessError(error.message || "요청 처리 중 오류가 발생했습니다.", undefined, status),
    );
  },
);

/** Axios 응답 바디 `{ success, data, error }` 에서 `data`만 검증 후 반환합니다. */
export function extractData<T>(body: ApiEnvelope<T>): T {
  return unwrapApiBody(body);
}
