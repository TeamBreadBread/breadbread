/** 챗봇 말풍선 버튼이 실행하는 액션 */
export type ChatButtonAction =
  | "change_course"
  | "keep_course"
  | "cancel_reservation"
  | "reserve_taxi"
  | "view_bakery_info"
  | "swap_bakery";

export type ChatActionButton = {
  label: string;
  action: ChatButtonAction;
  bakeryId?: number;
};

const CHAT_BUTTON_ACTIONS = new Set<ChatButtonAction>([
  "change_course",
  "keep_course",
  "cancel_reservation",
  "reserve_taxi",
  "view_bakery_info",
  "swap_bakery",
]);

export function isChatButtonAction(value: string): value is ChatButtonAction {
  return CHAT_BUTTON_ACTIONS.has(value as ChatButtonAction);
}

/** n8n/큐레이터 응답의 buttons 배열을 FE 액션 버튼으로 변환 */
export function parseCuratorActionButtons(
  buttons: Array<{ label?: string; action?: string }> | undefined,
): ChatActionButton[] {
  if (!buttons?.length) return [];

  return buttons.flatMap((button) => {
    const label = button.label?.trim();
    const action = button.action?.trim();
    if (!label || !action || !isChatButtonAction(action)) return [];
    return [{ label, action }];
  });
}

export const CONGESTION_ACTION_BUTTONS: ChatActionButton[] = [
  { label: "코스 변경", action: "change_course" },
  { label: "그대로 진행", action: "keep_course" },
  { label: "예약 취소", action: "cancel_reservation" },
];

export function buildCongestionChatButtons(
  alternativeBakeryName: string,
  alternativeBakeryId: number,
): ChatActionButton[] {
  return [
    {
      label: `${alternativeBakeryName} 정보 보기`,
      action: "view_bakery_info",
      bakeryId: alternativeBakeryId,
    },
    { label: "변경할래", action: "swap_bakery", bakeryId: alternativeBakeryId },
    { label: "기존 코스로 안내", action: "keep_course" },
  ];
}

export const RESERVE_NUDGE_ACTION_BUTTONS: ChatActionButton[] = [
  { label: "빵택시 예약하기", action: "reserve_taxi" },
];
