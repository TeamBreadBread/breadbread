import { useEffect, useRef, useState } from "react";
import { sendCuratorChat } from "@/api/curator";
import { getErrorMessage } from "@/api/types/common";
import { cn } from "@/utils/cn";
import BreadDefaultLogo from "@/assets/icons/BreadDefaultLogo.svg";

type ChatRole = "user" | "bot";

type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
};

type CuratorChatWidgetProps = {
  /** 현재 보고 있는 코스 컨텍스트(있으면 함께 전달) */
  courseId?: number | null;
};

export default function CuratorChatWidget({ courseId }: CuratorChatWidgetProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading, open]);

  const handleSend = () => {
    const text = input.trim();
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
                  코스에 대해 무엇이든 물어보세요
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
                <p className="px-x1 py-x2 font-pretendard text-size-3 leading-t4 text-gray-500">
                  안녕하세요! 추천된 코스에 대해 궁금한 점을 물어보세요.
                </p>
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

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[70] mx-auto w-full max-w-[744px]">
        <button
          type="button"
          aria-label={open ? "AI 큐레이터 닫기" : "AI 큐레이터 채팅 열기"}
          onClick={() => setOpen((v) => !v)}
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
