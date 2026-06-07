import { parseCuratorActionButtons, type ChatActionButton } from "@/types/curatorActions";
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
    buttons?: Array<{ label?: string; action?: string }>;
  };
  buttons?: Array<{ label?: string; action?: string }>;
};

export type CuratorChatResult = {
  message: string;
  conversationId: string;
  messageId: string;
  /** AI 응답 종류. 코스 변경 제안 등 특수 응답이면 `chat`이 아닌 값이 온다. */
  type: string;
  /** n8n 웹훅이 내려주는 버튼 (없으면 FE에서 type 기반 기본 버튼 사용) */
  buttons: ChatActionButton[];
};

/** `POST /curator/chat` — 사용자 메시지를 AI에 전달하고 응답을 반환합니다. */
export async function sendCuratorChat(body: CuratorChatRequest): Promise<CuratorChatResult> {
  const { data } = await apiClient.post<ApiEnvelope<CuratorChatInner>>(`${PATH}/chat`, body);
  const inner = extractData(data);
  const buttons =
    parseCuratorActionButtons(inner.buttons).length > 0
      ? parseCuratorActionButtons(inner.buttons)
      : parseCuratorActionButtons(inner.data.buttons);

  return { ...inner.data, type: inner.type, buttons };
}
