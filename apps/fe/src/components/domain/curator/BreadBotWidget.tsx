import { useEffect, useRef, useState } from "react";
import { sendCuratorChat } from "@/api/curator";
import { getErrorMessage } from "@/api/types/common";
import type { BotBubble } from "@/lib/auth/LoginRequiredContext";
import { cn } from "@/utils/cn";
import BreadDefaultLogo from "@/assets/icons/BreadDefaultLogo.svg";

const QUICK_REPLIES = [
  "현재 코스 설명해줘",
  "다음 빵집 추천해줘",
  "코스 순서 바꿀까?",
  "혼잡하면 어디가 좋아?",
] as const;

type ChatRole = "user" | "bot";

type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
};

type BreadBotWidgetProps = {
  /** 현재 표시할 말풍선(없으면 숨김) */
  bubble: BotBubble | null;
  /** 큐레이터 채팅에 함께 보낼 코스 컨텍스트 */
  courseId?: number | null;
  /** "게스트로 이용하기(계속 진행)" — 말풍선만 닫고 현재 화면 유지 */
  onGuestContinue: () => void;
  /** "로그인하러가기" */
  onGoLogin: () => void;
  /** 말풍선 닫기(X, 또는 채팅 열기 등) */
  onCloseBubble: () => void;
};

export default function BreadBotWidget({
  bubble,
  courseId,
  onGuestContinue,
  onGoLogin,
  onCloseBubble,
}: BreadBotWidgetProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading, open]);

  const openChat = () => {
    onCloseBubble();
    setOpen(true);
  };

  const sendMessage = (raw: string) => {
    const text = raw.trim();
    if (!text || loading) return;

    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: "user", text }]);
    setInput("");
    setLoading(true);

    void (async () => {
      try {
        const res = await sendCuratorChat({
          message: text,
          courseId: courseId ?? undefined,
          conversationId,
        });
        setConversationId(res.conversationId);
        setMessages((prev) => [
          ...prev,
          { id: res.messageId || `b-${Date.now()}`, role: "bot", text: res.message },
        ]);
      } catch (e) {
        setMessages((prev) => [
          ...prev,
          { id: `e-${Date.now()}`, role: "bot", text: getErrorMessage(e) },
        ]);
      } finally {
        setLoading(false);
      }
    })();
  };

  const handleSend = () => sendMessage(input);

  const showBubble = bubble !== null && !open;

  return (
    <>
      {open ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[71] mx-auto flex w-full max-w-[744px] justify-end">
          <div className="pointer-events-auto fixed right-[20px] bottom-[172px] flex h-[60vh] max-h-[520px] w-[min(360px,calc(100%-40px))] flex-col overflow-hidden rounded-r4 bg-white shadow-[0_8px_32px_rgba(0,0,0,0.18)] md:right-[calc((100vw-744px)/2+20px)]">
            <div className="flex items-center gap-x2 border-b border-gray-200 px-x4 py-x3">
              <img src={BreadDefaultLogo} alt="" aria-hidden className="h-x8 w-x8 object-contain" />
              <div className="flex min-w-0 flex-col">
                <span className="font-pretendard text-size-4 font-bold leading-t5 text-gray-1000">
                  빵빵 큐레이터
                </span>
                <span className="font-pretendard text-size-2 leading-t3 text-gray-600">
                  무엇이든 물어보세요
                </span>
              </div>
              <button
                type="button"
                aria-label="닫기"
                onClick={() => setOpen(false)}
                className="ml-auto flex h-x8 w-x8 shrink-0 items-center justify-center rounded-full text-size-5 text-gray-500 hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            <div ref={listRef} className="flex-1 space-y-x2 overflow-y-auto px-x4 py-x3">
              {messages.length === 0 && !loading ? (
                <div className="space-y-x3">
                  <div className="rounded-r3 bg-gray-100 px-x3 py-x2-5">
                    <p className="whitespace-pre-line font-pretendard text-size-3 leading-t5 text-gray-1000">
                      {
                        "안녕하세요! 🍞\nBreadBread AI 큐레이터입니다.\n\n현재 코스 설명, 다음 빵집 추천, 순서 변경 등 궁금한 점을 자유롭게 물어보세요!"
                      }
                    </p>
                  </div>
                  <div className="flex flex-col gap-x2">
                    {QUICK_REPLIES.map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => sendMessage(q)}
                        className="w-full rounded-r3 border border-orange-300 bg-orange-100 px-x3 py-x2 text-left font-pretendard text-size-3 leading-t4 text-orange-700 transition-colors hover:bg-orange-200"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {messages.map((m) => (
                <div
                  key={m.id}
                  className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[80%] whitespace-pre-wrap rounded-r3 px-x3 py-x2 font-pretendard text-size-3 leading-t4",
                      m.role === "user"
                        ? "bg-orange-600 text-gray-00"
                        : "bg-gray-100 text-gray-1000",
                    )}
                  >
                    {m.text}
                  </div>
                </div>
              ))}

              {loading ? (
                <div className="flex justify-start">
                  <div className="rounded-r3 bg-gray-100 px-x3 py-x2 font-pretendard text-size-3 leading-t4 text-gray-500">
                    답변 작성 중…
                  </div>
                </div>
              ) : null}
            </div>

            <div className="flex items-center gap-x2 border-t border-gray-200 px-x3 py-x2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="메시지를 입력하세요"
                className="min-w-0 flex-1 rounded-r3 border border-gray-300 bg-gray-00 px-x3 py-x2 font-pretendard text-size-3 leading-t4 text-gray-1000 outline-none placeholder:text-gray-400"
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="shrink-0 rounded-r3 bg-orange-600 px-x4 py-x2 font-pretendard text-size-3 font-bold leading-t4 text-gray-00 disabled:bg-gray-300"
              >
                전송
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* 말풍선 (채팅이 닫혀 있을 때만) */}
      {showBubble ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[72] mx-auto w-full max-w-[744px]">
          <div className="pointer-events-auto fixed right-[20px] bottom-[170px] w-[min(280px,calc(100%-40px))] rounded-r4 bg-white p-x4 shadow-[0_8px_28px_rgba(0,0,0,0.2)] md:right-[calc((100vw-744px)/2+20px)]">
            <button
              type="button"
              aria-label="안내 닫기"
              onClick={onCloseBubble}
              className="absolute right-x2 top-x2 flex h-x6 w-x6 items-center justify-center rounded-full text-size-3 text-gray-400 hover:bg-gray-100"
            >
              ✕
            </button>

            <p className="whitespace-pre-wrap pr-x4 font-pretendard text-size-3 leading-t5 text-gray-1000">
              {bubble.text}
            </p>

            {bubble.kind === "login" ? (
              <div className="mt-x3 flex flex-col gap-x2">
                <button
                  type="button"
                  onClick={onGoLogin}
                  className="h-[40px] w-full rounded-r2 bg-orange-600 font-pretendard text-size-3 font-bold text-gray-00"
                >
                  로그인하러가기
                </button>
                <button
                  type="button"
                  onClick={onGuestContinue}
                  className="h-[40px] w-full rounded-r2 border border-gray-300 bg-white font-pretendard text-size-3 font-medium text-gray-700"
                >
                  게스트로 이용하기
                </button>
              </div>
            ) : null}

            {/* 봇을 가리키는 꼬리 */}
            <div className="absolute -bottom-[7px] right-[28px] h-[14px] w-[14px] rotate-45 bg-white shadow-[3px_3px_6px_rgba(0,0,0,0.06)]" />
          </div>
        </div>
      ) : null}

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[70] mx-auto w-full max-w-[744px]">
        <button
          type="button"
          aria-label={open ? "AI 큐레이터 닫기" : "AI 큐레이터 채팅 열기"}
          onClick={() => (open ? setOpen(false) : openChat())}
          className="pointer-events-auto fixed right-[20px] bottom-[104px] z-[70] flex h-[56px] w-[56px] items-center justify-center rounded-full bg-orange-200 shadow-[0_4px_12px_rgba(0,0,0,0.18)] md:right-[calc((100vw-744px)/2+20px)]"
        >
          <img
            src={BreadDefaultLogo}
            alt=""
            aria-hidden
            className="h-[36px] w-[36px] object-contain"
          />
        </button>
      </div>
    </>
  );
}
