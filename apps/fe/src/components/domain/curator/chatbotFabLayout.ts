import { cn } from "@/utils/cn";

/** 플로팅 버튼(right 20px, bottom 76/80px, 76px — Img_ChatBot.svg 자체) 바로 위 4px */
export const CHATBOT_FAB_SIZE = 76;

const CHATBOT_HORIZONTAL_POSITION = "fixed right-[20px] md:right-[calc((100vw-402px)/2+20px)]";

export const CHATBOT_FAB_POSITION_CLASS = cn(
  CHATBOT_HORIZONTAL_POSITION,
  "bottom-[76px] z-[70] sm:bottom-[80px]",
);

/** TourPage 하단 CTA(BottomNav 56/60 + py12 + btn52 + py12) 위 4px */
export const CHATBOT_FAB_POSITION_ABOVE_TOUR_CTA_CLASS = cn(
  CHATBOT_HORIZONTAL_POSITION,
  "bottom-[136px] z-[70] sm:bottom-[140px]",
);

export const CHATBOT_BUBBLE_ABOVE_FAB_CLASS = cn(
  CHATBOT_HORIZONTAL_POSITION,
  "bottom-[156px] z-[72] sm:bottom-[160px]",
);

export const CHATBOT_BUBBLE_ABOVE_TOUR_FAB_CLASS = cn(
  CHATBOT_HORIZONTAL_POSITION,
  "bottom-[216px] z-[72] sm:bottom-[220px]",
);

/** BreadBotWidget 인라인 말풍선 — FAB 하단 대비 +94px */
export const CHATBOT_INLINE_BUBBLE_ABOVE_FAB_CLASS = cn(
  CHATBOT_HORIZONTAL_POSITION,
  "bottom-[170px]",
);

export const CHATBOT_INLINE_BUBBLE_ABOVE_TOUR_FAB_CLASS = cn(
  CHATBOT_HORIZONTAL_POSITION,
  "bottom-[230px] sm:bottom-[234px]",
);

export function isTourPagePath(pathname: string): boolean {
  return pathname === "/tour";
}

export function resolveChatbotFabPositionClass(pathname: string): string {
  return isTourPagePath(pathname)
    ? CHATBOT_FAB_POSITION_ABOVE_TOUR_CTA_CLASS
    : CHATBOT_FAB_POSITION_CLASS;
}

export function resolveChatbotBubblePositionClass(pathname: string): string {
  return isTourPagePath(pathname)
    ? CHATBOT_BUBBLE_ABOVE_TOUR_FAB_CLASS
    : CHATBOT_BUBBLE_ABOVE_FAB_CLASS;
}

export function resolveChatbotInlineBubblePositionClass(pathname: string): string {
  return isTourPagePath(pathname)
    ? CHATBOT_INLINE_BUBBLE_ABOVE_TOUR_FAB_CLASS
    : CHATBOT_INLINE_BUBBLE_ABOVE_FAB_CLASS;
}
