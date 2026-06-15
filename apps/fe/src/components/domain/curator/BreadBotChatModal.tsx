import { useState, type ReactNode, type RefObject } from "react";
import DefaultBreadImage from "@/assets/images/Default_Bread.svg";
import SadBreadImage from "@/assets/images/Sad_Bread.svg";
import CelebrateImage from "@/assets/icons/Img_Celebrate.svg";
import type { ChatActionButton } from "@/types/curatorActions";
import { cn } from "@/utils/cn";
import BreadBotBakeryInfoCard from "./BreadBotBakeryInfoCard";
import BreadBotCourseMapCard from "./BreadBotCourseMapCard";
import BreadBotTourPanel from "./BreadBotTourPanel";
import {
  QUICK_REPLIES,
  WELCOME_SUBTITLE,
  BACK_TO_START_FOOTER_LABEL,
  type ChatMessage,
  type CourseMovementBubble,
} from "./breadBotChat.types";
import "./BreadBotTypingIndicator.css";

type BreadBotChatModalProps = {
  listRef: RefObject<HTMLDivElement | null>;
  messages: ChatMessage[];
  loading: boolean;
  courseId?: number | null;
  courseMovementBubble: CourseMovementBubble | null;
  courseGuideActive: boolean;
  /** 진행 중인 투어의 courseId — 있으면 채팅/투어 진행 탭이 표시된다 */
  activeTourCourseId?: number | null;
  onClose: () => void;
  onQuickReply: (label: string) => void;
  onAction: (button: ChatActionButton) => void;
  onCourseDetail: () => void;
  onBackToStart: () => void;
  /** 투어 탭에서 "전체 화면으로 보기" — 모달 닫고 /tour 이동 */
  onOpenTourPage: () => void;
};

const CHAT_TABS = ["채팅", "투어 진행"] as const;
type ChatTab = (typeof CHAT_TABS)[number];

/** 자유 게시판/빵티클 게시판과 동일한 패턴의 상단 탭 */
function ChatModalTabs({
  activeTab,
  onChange,
}: {
  activeTab: ChatTab;
  onChange: (tab: ChatTab) => void;
}) {
  return (
    // relative z-[1]: 헤더 빵 마스코트(아래로 1/4 내려옴)가 탭을 가리지 않고 뒤로 깔리도록
    <div className="relative z-[1] flex shrink-0 items-center justify-between border-b border-gray-100 bg-gray-00">
      {CHAT_TABS.map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onChange(tab)}
          className={cn(
            "h-[44px] flex-1 shrink-0 border-b-2 px-x4",
            activeTab === tab ? "border-gray-1000" : "border-transparent",
          )}
        >
          <span
            className={cn(
              "font-pretendard text-size-3 leading-t4 text-gray-1000",
              activeTab === tab ? "font-bold" : "font-medium text-gray-500",
            )}
          >
            {tab}
          </span>
        </button>
      ))}
    </div>
  );
}

function isCongestionBubble(bubble: CourseMovementBubble) {
  return bubble.title.includes("혼잡");
}

function getCongestionHeaderLines(bubble: CourseMovementBubble) {
  const bakeryName = bubble.title.replace(" 혼잡해요", "").trim();
  return {
    titleLine: `${bakeryName}으로 이동중...`,
    bodyLine: `지금 ${bakeryName} 웨이팅이 너무 많아서 빵을 못 먹을 수 있어요 ㅠㅠ`,
  };
}

function HeaderBreadMascot({ src }: { src: string }) {
  return (
    <img
      src={src}
      alt=""
      aria-hidden
      className="pointer-events-none absolute right-x5 bottom-0 z-0 h-[72px] w-[72px] translate-y-1/4 object-contain"
    />
  );
}

function DefaultChatHeader() {
  return (
    <div className="relative pr-[84px]">
      <p className="font-pretendard text-size-3 leading-t5 text-gray-1000">
        안녕하세요! <span className="font-bold">빵빵 AI 큐레이터</span>입니다.
      </p>
      <p className="mt-x1 font-pretendard text-size-3 leading-t5 text-gray-1000">
        {WELCOME_SUBTITLE}
      </p>
    </div>
  );
}

function CongestionChatHeader({ bubble }: { bubble: CourseMovementBubble }) {
  const { titleLine, bodyLine } = getCongestionHeaderLines(bubble);

  return (
    <div className="relative pr-[84px]">
      <p className="font-pretendard text-size-3 font-bold leading-t5 text-gray-1000">{titleLine}</p>
      <p className="mt-x1 font-pretendard text-size-3 leading-t5 text-gray-1000">{bodyLine}</p>
    </div>
  );
}

function ChatbotTypingIndicator() {
  return (
    <div className="flex w-full justify-start">
      <div className="flex h-[30px] w-[50px] items-center justify-center rounded-r4 bg-gray-00 shadow-[0_1px_3px_rgba(26,31,39,0.05)]">
        <div className="cs-typing-indicator chatbot-typing-indicator--compact" aria-hidden>
          <div className="cs-typing-indicator__indicator">
            <span className="cs-typing-indicator__dot" />
            <span className="cs-typing-indicator__dot" />
            <span className="cs-typing-indicator__dot" />
          </div>
        </div>
      </div>
    </div>
  );
}

function BotSpeechBubble({
  children,
  tone = "default",
  className,
}: {
  children: ReactNode;
  tone?: "default" | "warm";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative w-full max-w-full rounded-r4 rounded-tl-r1 px-x4 py-x3 shadow-[0_1px_3px_rgba(26,31,39,0.05)]",
        tone === "warm" ? "bg-orange-100" : "bg-gray-00",
        className,
      )}
    >
      <span
        className={cn(
          "absolute -left-[5px] top-x4 h-[10px] w-[10px] rotate-45",
          tone === "warm" ? "bg-orange-100" : "bg-gray-00",
        )}
        aria-hidden
      />
      {children}
    </div>
  );
}

function QuickReplyButtonsInside({
  labels,
  disabled,
  onSelect,
}: {
  labels: readonly string[];
  disabled?: boolean;
  onSelect: (label: string) => void;
}) {
  return (
    <div className="mt-x3 flex flex-col gap-x2">
      {labels.map((label) => (
        <button
          key={label}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(label)}
          className="flex h-[47px] w-[231px] max-w-full items-center justify-center rounded-r3 bg-gray-100 px-x4 font-pretendard text-size-3 leading-t4 text-gray-1000 transition-colors hover:bg-gray-200 disabled:opacity-50"
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function ModalActionButtons({
  actions,
  disabled,
  onAction,
}: {
  actions: NonNullable<ChatMessage["actions"]>;
  disabled?: boolean;
  onAction: (button: ChatActionButton) => void;
}) {
  return (
    <div className="mt-x3 flex flex-col gap-x2 border-t border-gray-300/50 pt-x3">
      {actions.map((action) => (
        <button
          key={`${action.action}-${action.label}-${action.bakeryId ?? ""}`}
          type="button"
          disabled={disabled}
          onClick={() => onAction(action)}
          className={cn(
            "flex h-[47px] w-full max-w-[231px] items-center justify-center rounded-r3 px-x4 font-pretendard text-size-3 leading-t4 transition-colors disabled:opacity-50",
            action.action === "swap_bakery"
              ? "bg-orange-600 font-bold text-gray-00 shadow-[0_4px_12px_rgba(255,134,72,0.28)] hover:bg-orange-700"
              : "bg-gray-100 font-medium text-gray-1000 hover:bg-gray-200",
          )}
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}

function WelcomeSpeechBubble({
  showButtons,
  disabled,
  onQuickReply,
}: {
  showButtons?: boolean;
  disabled?: boolean;
  onQuickReply: (label: string) => void;
}) {
  return (
    <BotSpeechBubble>
      <p className="font-pretendard text-size-3 leading-t5 text-gray-1000">
        안녕하세요! <span className="font-bold">빵빵 AI 큐레이터</span>입니다.
      </p>
      <p className="mt-x1 font-pretendard text-size-3 leading-t5 text-gray-1000">
        {WELCOME_SUBTITLE}
      </p>
      {showButtons ? (
        <QuickReplyButtonsInside
          labels={QUICK_REPLIES}
          disabled={disabled}
          onSelect={onQuickReply}
        />
      ) : null}
    </BotSpeechBubble>
  );
}

const CONGESTION_DISCLAIMER =
  "※ 혼잡도 정보는 SNS 데이터를 기반으로 예측되며,\n실제 현장 상황과 다를 수 있습니다.";

function BotMessageBlock({
  message,
  loading,
  courseId,
  onQuickReply,
  onAction,
  onCourseDetail,
}: {
  message: ChatMessage;
  loading: boolean;
  courseId?: number | null;
  onQuickReply: (label: string) => void;
  onAction: (button: ChatActionButton) => void;
  onCourseDetail: () => void;
}) {
  return (
    <div className="flex w-full max-w-[92%] flex-col items-start">
      <BotSpeechBubble tone={message.showSadBread ? "warm" : "default"}>
        {message.showCelebration ? (
          <img
            src={CelebrateImage}
            alt=""
            aria-hidden
            className="mx-auto mb-x3 h-[96px] w-[96px] object-contain"
          />
        ) : null}

        <p className="whitespace-pre-wrap font-pretendard text-size-3 leading-t5 text-gray-1000">
          {message.text}
        </p>

        {message.showSadBread ? (
          <p className="mt-x2 whitespace-pre-wrap font-pretendard typo-t2regular text-gray-600">
            {CONGESTION_DISCLAIMER}
          </p>
        ) : null}

        {message.showSadBread ? (
          <img
            src={SadBreadImage}
            alt=""
            aria-hidden
            className="mt-x3 h-[64px] w-[64px] object-contain"
          />
        ) : null}

        {message.quickReplies && message.quickReplies.length > 0 ? (
          <QuickReplyButtonsInside
            labels={message.quickReplies}
            disabled={loading}
            onSelect={onQuickReply}
          />
        ) : null}

        {message.actions && message.actions.length > 0 ? (
          <ModalActionButtons actions={message.actions} disabled={loading} onAction={onAction} />
        ) : null}

        {message.showBakeryInfoId ? (
          <div className="mt-x3 border-t border-gray-300/50 pt-x3">
            <BreadBotBakeryInfoCard bakeryId={message.showBakeryInfoId} />
          </div>
        ) : null}

        {message.showCourseMap && courseId && courseId > 0 ? (
          <div className="mt-x3 border-t border-gray-300/50 pt-x3">
            <BreadBotCourseMapCard courseId={courseId} onDetailClick={onCourseDetail} />
          </div>
        ) : null}
      </BotSpeechBubble>
    </div>
  );
}

export default function BreadBotChatModal({
  listRef,
  messages,
  loading,
  courseId,
  courseMovementBubble,
  courseGuideActive,
  activeTourCourseId,
  onClose,
  onQuickReply,
  onAction,
  onCourseDetail,
  onBackToStart,
  onOpenTourPage,
}: BreadBotChatModalProps) {
  const showTourTab = activeTourCourseId != null && activeTourCourseId > 0;
  const [selectedTab, setSelectedTab] = useState<ChatTab>("채팅");

  // 투어가 끝나면(탭 숨김) 자동으로 채팅 뷰로 복귀 — 완료 축하 메시지가 채팅에 표시됨
  const activeTab: ChatTab = showTourTab ? selectedTab : "채팅";
  const isTourTab = showTourTab && activeTab === "투어 진행";
  const showWelcomeButtons = messages.length === 0 && !loading;
  const showBackToStartFooter = !isTourTab && (messages.length > 0 || loading);
  const showCongestionHeader =
    courseGuideActive && courseMovementBubble != null && isCongestionBubble(courseMovementBubble);

  return (
    <div
      className="pointer-events-auto fixed inset-x-0 top-0 bottom-[56px] z-[71] flex items-end justify-center bg-gray-1000/20 px-x4 pb-x4 pt-x8 sm:bottom-[60px] sm:items-center sm:pb-x8"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="flex w-[362px] max-w-[calc(100vw-32px)] flex-col items-end gap-x3"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="빵빵 AI 큐레이터"
      >
        <div className="relative flex h-[572px] w-full flex-col overflow-hidden rounded-r6 bg-gray-00 shadow-[0_20px_48px_rgba(26,31,39,0.18)]">
          <div className="relative shrink-0 bg-gray-00 px-x5 pb-x4 pt-x5">
            {showCongestionHeader && courseMovementBubble ? (
              <CongestionChatHeader bubble={courseMovementBubble} />
            ) : (
              <DefaultChatHeader />
            )}
            <HeaderBreadMascot src={showCongestionHeader ? SadBreadImage : DefaultBreadImage} />
          </div>

          {showTourTab ? <ChatModalTabs activeTab={activeTab} onChange={setSelectedTab} /> : null}

          {isTourTab && activeTourCourseId ? (
            <div className="relative z-[1] flex min-h-0 flex-1 flex-col overflow-y-auto bg-gray-100 px-x4 pb-x5 pt-x4">
              <BreadBotTourPanel courseId={activeTourCourseId} onOpenFullPage={onOpenTourPage} />
            </div>
          ) : (
            <div
              ref={listRef}
              className="relative z-[1] flex min-h-0 flex-1 flex-col gap-x4 overflow-y-auto bg-gray-100 px-x5 pb-x5 pt-x4"
            >
              <WelcomeSpeechBubble
                showButtons={showWelcomeButtons}
                disabled={loading}
                onQuickReply={onQuickReply}
              />

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex w-full",
                    message.role === "user" ? "justify-end" : "justify-start",
                  )}
                >
                  {message.role === "user" ? (
                    <div className="max-w-[88%] rounded-r4 rounded-tr-r1 bg-orange-600 px-x4 py-x3 font-pretendard text-size-3 leading-t5 text-gray-00 shadow-[0_4px_14px_rgba(255,134,72,0.24)]">
                      {message.text}
                    </div>
                  ) : (
                    <BotMessageBlock
                      message={message}
                      loading={loading}
                      courseId={courseId}
                      onQuickReply={onQuickReply}
                      onAction={onAction}
                      onCourseDetail={onCourseDetail}
                    />
                  )}
                </div>
              ))}

              {loading ? <ChatbotTypingIndicator /> : null}
            </div>
          )}

          {showBackToStartFooter ? (
            <div className="shrink-0 border-t border-gray-300/60 bg-gray-100 px-x5 py-x3">
              <button
                type="button"
                disabled={loading}
                onClick={onBackToStart}
                className="flex h-[47px] w-full items-center justify-center rounded-r3 bg-gray-00 font-pretendard text-size-3 leading-t4 text-gray-1000 shadow-[0_1px_2px_rgba(26,31,39,0.05)] transition-colors hover:bg-gray-200 disabled:opacity-50"
              >
                {BACK_TO_START_FOOTER_LABEL}
              </button>
            </div>
          ) : null}
        </div>

        <button
          type="button"
          aria-label="챗봇 닫기"
          onClick={onClose}
          className="flex h-x12 w-x12 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-gray-00 text-size-5 text-gray-700 shadow-[0_8px_20px_rgba(26,31,39,0.16)] transition-colors hover:bg-gray-100"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
