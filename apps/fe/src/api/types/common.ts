import axios from "axios";

/** 백엔드 Swagger `ApiResponse` 공통 형태 */
export type ApiEnvelope<T = unknown> = {
  success: boolean;
  data: T | null;
  error: {
    code: string;
    message: string;
  } | null;
};

export class ApiBusinessError extends Error {
  readonly code?: string;
  readonly status?: number;

  constructor(message: string, code?: string, status?: number) {
    super(message);
    this.name = "ApiBusinessError";
    this.code = code;
    this.status = status;
  }
}

export function unwrapApiBody<T>(body: ApiEnvelope<T>): T {
  if (body.success) {
    if (body.error) {
      throw new ApiBusinessError(body.error.message, body.error.code);
    }
    return body.data as T;
  }
  if (body.error) {
    throw new ApiBusinessError(body.error.message, body.error.code);
  }
  throw new ApiBusinessError("요청에 실패했습니다.");
}

/**
 * `catch` 블록에서 서버 `error.message` 또는 네트워크 메시지를 얻을 때 사용합니다.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiBusinessError) {
    return error.message;
  }
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiEnvelope | undefined;
    if (data?.error?.message) {
      return data.error.message;
    }
    if (error.message) {
      return error.message;
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "알 수 없는 오류가 발생했습니다.";
}
