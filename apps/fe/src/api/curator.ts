import { apiClient, extractData } from "@/api/client";
import type { ApiEnvelope } from "@/api/types/common";

const PATH = "/curator";

export type CuratorChatRequest = {
  message: string;
  courseId?: number;
  conversationId?: string;
};

/** 백엔드 응답의 안쪽 래퍼 — `data.data`에 실제 메시지가 들어 있다. */
type CuratorChatInner = {
  success: boolean;
  type: string;
  data: {
    message: string;
    conversationId: string;
    messageId: string;
  };
};

export type CuratorChatResult = {
  message: string;
  conversationId: string;
  messageId: string;
};

/** `POST /curator/chat` — 사용자 메시지를 AI에 전달하고 응답을 반환합니다. */
export async function sendCuratorChat(body: CuratorChatRequest): Promise<CuratorChatResult> {
  const { data } = await apiClient.post<ApiEnvelope<CuratorChatInner>>(`${PATH}/chat`, body);
  const inner = extractData(data);
  return inner.data;
}
