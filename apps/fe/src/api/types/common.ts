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
    const code = error.code;
    if (code === "ECONNABORTED") {
      return "요청 시간이 초과되었습니다. 네트워크 상태를 확인한 뒤 다시 시도해 주세요.";
    }
    // 일부 환경에선 `code`가 비어 있고 메시지에만 timeout이 남습니다.
    if (typeof error.message === "string" && /timeout of \d+ms exceeded/i.test(error.message)) {
      return "요청 시간이 초과되었습니다. 네트워크 상태를 확인한 뒤 다시 시도해 주세요.";
    }
    if (code === "ERR_NETWORK" || code === "ETIMEDOUT") {
      return "네트워크 연결이 불안정합니다. Wi-Fi 또는 데이터 연결을 확인해 주세요.";
    }
    const data = error.response?.data as ApiEnvelope | undefined;
    if (data?.error?.message) {
      return data.error.message;
    }
    if (!error.response) {
      return "서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.";
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
