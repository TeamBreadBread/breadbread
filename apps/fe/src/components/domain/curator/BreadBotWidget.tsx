import { useEffect, useRef, useState } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { sendCuratorChat } from "@/api/curator";
import { getMyReservations, getReservationById, type ReservationSummary } from "@/api/reservation";
import { getCurrentTour, startTour } from "@/api/tours";
import { getErrorMessage } from "@/api/types/common";
import { isLoggedIn } from "@/lib/auth/isLoggedIn";
import { useLoginRequired } from "@/lib/auth/useLoginRequired";
import { cn } from "@/utils/cn";
import BreadDefaultLogo from "@/assets/icons/BreadDefaultLogo.svg";
const QUICK_REPLIES = [
  "현재 코스 설명해줘",
  "다음 빵집 추천해줘",
  "코스 순서 바꿀까?",
  "혼잡하면 어디가 좋아?",
] as const;

const WELCOME_MESSAGE =
  "안녕하세요! 🍞 BreadBread AI 큐레이터입니다.\n현재 코스 설명, 다음 빵집 추천, 순서 변경 등 궁금한 점을 자유롭게 물어보세요!";

/** 챗봇 대화 영속화 키 */
const CHAT_STORAGE_KEY = "breadbot:chat:v1";

type ChatRole = "user" | "bot";

/** 봇 메시지에 따라붙는 액션 버튼 (클릭 시 해당 메시지를 다시 AI에 전송) */
type ChatAction = { label: string; reply: string };

/** 혼잡 상황 알림류 — "다른 빵집 추천 / 그대로 진행" */
const CONGESTION_TYPES = new Set(["congestion", "crowd", "busy", "course_alert"]);

/** 코스 변경 제안류 — "코스 변경 / 코스 취소" */
const COURSE_CHANGE_TYPES = new Set([
  "course_change",
  "course_update",
  "course_reorder",
  "reroute",
  "change",
]);

/**
 * AI 응답 type에 따라 노출할 액션 버튼.
 * n8n 웹훅이 일반 대화는 `chat`을, 변경/혼잡 상황에는 아래 type 중 하나를 반환한다.
 */
function actionsForType(type: string | undefined): ChatAction[] {
  const t = type?.trim().toLowerCase();
  if (!t) return [];
  if (CONGESTION_TYPES.has(t)) {
    return [
      { label: "다른 빵집 추천", reply: "다른 빵집 추천해줘" },
      { label: "그대로 진행", reply: "그대로 진행할게" },
    ];
  }
  if (COURSE_CHANGE_TYPES.has(t)) {
    return [
      { label: "코스 변경", reply: "코스 변경해줘" },
      { label: "코스 취소", reply: "코스 취소할게" },
    ];
  }
  return [];
}

type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
  /** 코스 변경 등 액션 버튼 (봇 메시지에만) */
  actions?: ChatAction[];
};

/** 예약 알림 / 진행 중 투어 이어가기 안내 말풍선 */
type TourBubble = {
  courseId: number;
  courseName: string;
  mode: "start" | "resume";
  /** 단계별 안내 문구(없으면 mode 기본 문구) */
  text?: string;
  dismissKey: string;
};

/** "YYYY-MM-DD" + "HH:mm" → epoch ms (파싱 실패 시 null) */
function reservationStartMs(date: string, time: string): number | null {
  if (!date) return null;
  const hhmm = (time || "00:00").slice(0, 5);
  const ms = new Date(`${date}T${hhmm}:00`).getTime();
  return Number.isNaN(ms) ? null : ms;
}

/** "HH:mm" 형태로 출발 시간 표기 */
function formatHhmm(time: string): string {
  return (time || "").slice(0, 5);
}

/** 두 시각이 같은 로컬 날짜인지 */
function isSameLocalDay(a: number, b: number): boolean {
  const d1 = new Date(a);
  const d2 = new Date(b);
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

/** 출발 시간 도달 후 안내/자동 시작을 유지할 시간(이 시간을 넘기면 동작하지 않음) */
const TOUR_REMINDER_WINDOW_MS = 3 * 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;

/** 단계별 알림을 1회만 띄우기 위한 sessionStorage 기반 dedup */
const TOUR_FIRED_KEY = "bbang_tour_reminders_fired";
function hasFiredReminder(key: string): boolean {
  try {
    const raw = sessionStorage.getItem(TOUR_FIRED_KEY);
    if (!raw) return false;
    return (JSON.parse(raw) as string[]).includes(key);
  } catch {
    return false;
  }
}
function markFiredReminder(key: string): void {
  try {
    const raw = sessionStorage.getItem(TOUR_FIRED_KEY);
    const list = raw ? (JSON.parse(raw) as string[]) : [];
    if (!list.includes(key)) {
      list.push(key);
      sessionStorage.setItem(TOUR_FIRED_KEY, JSON.stringify(list));
    }
  } catch {
    // 저장 실패 시 무시 (중복 알림이 한 번 더 뜰 수 있음)
  }
}

type PersistedChat = { messages: ChatMessage[]; conversationId?: string };

/** localStorage에서 저장된 대화를 복원한다(없거나 깨지면 빈 값). */
function loadPersistedChat(): PersistedChat {
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY);
    if (!raw) return { messages: [] };
    const parsed = JSON.parse(raw) as Partial<PersistedChat>;
    return {
      messages: Array.isArray(parsed.messages) ? parsed.messages : [],
      conversationId: typeof parsed.conversationId === "string" ? parsed.conversationId : undefined,
    };
  } catch {
    return { messages: [] };
  }
}

type BreadBotWidgetProps = {
  /** 큐레이터 채팅에 함께 보낼 코스 컨텍스트 */
  courseId?: number | null;
  /** 플로팅 버튼 노출 여부 (자유게시판·후기 등에서는 숨김) */
  showFloatingButton?: boolean;
};

export default function BreadBotWidget({
  courseId,
  showFloatingButton = true,
}: BreadBotWidgetProps) {
  const { startCourseGuide } = useLoginRequired();
  const navigate = useNavigate();
  const onTourPage = useRouterState({ select: (s) => s.location.pathname.startsWith("/tour") });
  const [open, setOpen] = useState(false);
  const [persisted] = useState(loadPersistedChat);
  const [messages, setMessages] = useState<ChatMessage[]>(persisted.messages);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string | undefined>(
    persisted.conversationId,
  );
  const [loading, setLoading] = useState(false);
  // 채팅이 닫혀 있어도 노출할 코스 변경/혼잡 알림 말풍선
  const [changeBubble, setChangeBubble] = useState<{ text: string; actions: ChatAction[] } | null>(
    null,
  );
  // 예약 출발 시간 알림 / 진행 중 투어 이어가기 말풍선
  const [tourBubble, setTourBubble] = useState<TourBubble | null>(null);
  const dismissedTourRef = useRef<Set<string>>(new Set());
  const navigateRef = useRef(navigate);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    navigateRef.current = navigate;
  });

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading, open]);

  // 진행 중 투어 / 예약 단계별 알림 / 예약 시간 도달 시 자동 시작
  useEffect(() => {
    if (!isLoggedIn()) return;
    let cancelled = false;

    const check = async () => {
      try {
        // 1) 진행 중 투어가 있으면 "이어서 진행하기"
        const current = await getCurrentTour();
        if (cancelled) return;
        if (current && current.status === "IN_PROGRESS") {
          const key = `resume:${current.courseId}`;
          if (!dismissedTourRef.current.has(key)) {
            setTourBubble({
              courseId: current.courseId,
              courseName: "",
              mode: "resume",
              dismissKey: key,
            });
          }
          return;
        }

        // 2) 당일 가장 임박한 확정/대기 예약 찾기 (출발 후 3시간 이내까지)
        const reservations = await getMyReservations();
        if (cancelled) return;
        const now = Date.now();
        let candidate: { r: ReservationSummary; start: number } | null = null;
        for (const r of reservations) {
          if (r.status !== "CONFIRMED" && r.status !== "PENDING") continue;
          const start = reservationStartMs(r.departureDate, r.departureTime);
          if (start == null) continue;
          if (now > start + TOUR_REMINDER_WINDOW_MS) continue;
          if (!isSameLocalDay(now, start)) continue;
          if (!candidate || start < candidate.start) candidate = { r, start };
        }
        if (!candidate) {
          setTourBubble(null);
          return;
        }

        const { r, start } = candidate;
        const id = r.id;
        const minutesUntil = (start - now) / MINUTE_MS;

        // 3) 예약 시간 도달 → 투어 자동 시작 후 투어 화면으로 이동 (1회)
        if (now >= start) {
          const autoKey = `autostart:${id}`;
          if (!hasFiredReminder(autoKey)) {
            markFiredReminder(autoKey);
            const detail = await getReservationById(id);
            if (cancelled) return;
            await startTour(detail.course.id).catch(() => undefined);
            navigateRef.current({ to: "/tour", search: { courseId: detail.course.id } });
          }
          return;
        }

        // 4) 출발 전 단계별 알림 (10분 전 > 1시간 전 > 당일 오전 8시)
        let stageKey: string | null = null;
        let buildText: ((courseName: string) => string) | null = null;
        if (minutesUntil <= 10) {
          stageKey = `t10:${id}`;
          buildText = (name) =>
            `'${name || "코스"}' 출발 10분 전이에요! ⏰\n예약 시간이 되면 빵 투어가 자동으로 시작돼요.`;
        } else if (minutesUntil <= 60) {
          stageKey = `t60:${id}`;
          buildText = (name) => `'${name || "코스"}' 출발 1시간 전이에요! 🚕\n슬슬 준비해 주세요.`;
        } else if (new Date(now).getHours() >= 8) {
          stageKey = `morning:${id}`;
          buildText = (name) =>
            `오늘 '${name || "코스"}' 빵 투어가 있어요! 🍞\n출발 시간: ${formatHhmm(r.departureTime)}`;
        }

        if (!stageKey || !buildText) return; // 아직 오전 8시 전 등 — 알림 단계 아님
        if (hasFiredReminder(stageKey) || dismissedTourRef.current.has(stageKey)) return;

        const detail = await getReservationById(id);
        if (cancelled) return;
        markFiredReminder(stageKey);
        setTourBubble({
          courseId: detail.course.id,
          courseName: detail.course.name,
          mode: "start",
          text: buildText(detail.course.name),
          dismissKey: stageKey,
        });
      } catch {
        // 네트워크/권한 등 오류는 조용히 무시
      }
    };

    void check();
    const timer = setInterval(() => void check(), 60_000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  // 대화 내용을 localStorage에 영속화(새로고침/재방문 시 복원)
  useEffect(() => {
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify({ messages, conversationId }));
    } catch {
      // 저장 실패(용량 초과/비활성) 시 조용히 무시
    }
  }, [messages, conversationId]);

  const openChat = () => {
    setChangeBubble(null);
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
        const actions = actionsForType(res.type);
        setMessages((prev) => [
          ...prev,
          {
            id: res.messageId || `b-${Date.now()}`,
            role: "bot",
            text: res.message,
            actions,
          },
        ]);
        // 변경/혼잡 알림이면, 채팅을 닫아도 보이도록 말풍선으로도 띄운다.
        if (actions.length > 0) {
          setChangeBubble({ text: res.message, actions });
        }
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

  const handleQuickReply = (label: string) => {
    sendMessage(label);
  };

  // 대화 도중 추천 질문(가이드) 버튼을 다시 띄운다.
  const showGuide = () => {
    setMessages((prev) => [
      ...prev,
      {
        id: `guide-${Date.now()}`,
        role: "bot",
        text: "무엇이 궁금하세요? 아래에서 골라보세요 🍞",
        actions: QUICK_REPLIES.map((q) => ({ label: q, reply: q })),
      },
    ]);
  };

  // 변경 알림 말풍선의 버튼 클릭 → 채팅을 열고 해당 의도를 AI에 전송
  const handleChangeAction = (reply: string) => {
    setChangeBubble(null);
    setOpen(true);
    sendMessage(reply);
  };

  // 예약/투어 말풍선의 버튼 클릭 → (필요 시) 투어 시작 후 투어 화면으로 이동
  const handleTourStart = async () => {
    if (!tourBubble) return;
    const { courseId: tourCourseId, mode } = tourBubble;
    setTourBubble(null);
    startCourseGuide(tourCourseId);
    if (mode === "start") {
      // 이미 진행 중(409)이면 무시하고 그대로 투어 화면으로 이동
      await startTour(tourCourseId).catch(() => undefined);
    }
    void navigate({ to: "/tour", search: { courseId: tourCourseId } });
  };

  const dismissTourBubble = () => {
    if (tourBubble) dismissedTourRef.current.add(tourBubble.dismissKey);
    setTourBubble(null);
  };

  const showTourBubble = tourBubble !== null && !open && !onTourPage;
  const showChangeBubble = tourBubble === null && changeBubble !== null && !open;

  return (
    <>
      {open ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[71] mx-auto flex w-full max-w-[402px] justify-end">
          <div className="pointer-events-auto fixed right-[20px] bottom-[172px] flex h-[60vh] max-h-[520px] w-[min(360px,calc(100%-40px))] flex-col overflow-hidden rounded-r4 bg-white shadow-[0_8px_32px_rgba(0,0,0,0.18)] md:right-[calc((100vw-402px)/2+20px)]">
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
                <div className="flex flex-col items-start gap-x2">
                  <div className="max-w-[85%] rounded-r3 bg-gray-100 px-x3 py-x2">
                    <p className="whitespace-pre-line font-pretendard text-size-3 leading-t5 text-gray-1000">
                      {WELCOME_MESSAGE}
                    </p>
                  </div>
                  <div className="grid w-full grid-cols-2 gap-x1-5 gap-y-x1-5">
                    {QUICK_REPLIES.map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => handleQuickReply(q)}
                        disabled={loading}
                        className="rounded-r2 border border-orange-200 bg-orange-50 px-x2 py-x1-5 text-center font-pretendard text-size-2 leading-t3 text-orange-700 transition-colors hover:bg-orange-100 disabled:opacity-50"
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
                  className={cn(
                    "flex flex-col gap-x1-5",
                    m.role === "user" ? "items-end" : "items-start",
                  )}
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

                  {m.role === "bot" && m.actions && m.actions.length > 0 ? (
                    <div className="grid w-full max-w-[85%] grid-cols-2 gap-x1-5 gap-y-x1-5">
                      {m.actions.map((action) => (
                        <button
                          key={action.label}
                          type="button"
                          disabled={loading}
                          onClick={() => handleQuickReply(action.label)}
                          className="rounded-r2 border border-orange-200 bg-orange-50 px-x2 py-x1-5 text-center font-pretendard text-size-2 leading-t3 text-orange-700 transition-colors hover:bg-orange-100 disabled:opacity-50"
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  ) : null}
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

            {messages.length > 0 ? (
              <div className="flex justify-center border-t border-gray-100 px-x3 pt-x2">
                <button
                  type="button"
                  onClick={showGuide}
                  className="rounded-full border border-orange-200 bg-orange-50 px-x2-5 py-x1 font-pretendard text-size-2 leading-t3 text-orange-700 transition-colors hover:bg-orange-100"
                >
                  💡 추천 질문 다시 보기
                </button>
              </div>
            ) : null}

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

      {/* 예약 출발 시간 알림 / 진행 중 투어 이어가기 말풍선 */}
      {showTourBubble && tourBubble ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[72] mx-auto w-full max-w-[402px]">
          <div className="pointer-events-auto fixed right-[20px] bottom-[170px] w-[min(280px,calc(100%-40px))] rounded-r4 bg-white p-x4 shadow-[0_8px_28px_rgba(0,0,0,0.2)] md:right-[calc((100vw-402px)/2+20px)]">
            <button
              type="button"
              aria-label="알림 닫기"
              onClick={dismissTourBubble}
              className="absolute right-x2 top-x2 flex h-x6 w-x6 items-center justify-center rounded-full text-size-3 text-gray-400 hover:bg-gray-100"
            >
              ✕
            </button>

            <p className="whitespace-pre-wrap pr-x4 font-pretendard text-size-3 leading-t5 text-gray-1000">
              {tourBubble.text ??
                (tourBubble.mode === "start"
                  ? `예약하신 '${tourBubble.courseName || "코스"}' 출발 시간이에요!\n지금 빵 투어를 시작할까요? 🍞`
                  : "진행 중인 빵 투어가 있어요.\n이어서 진행할까요?")}
            </p>

            <div className="mt-x3 flex flex-col gap-x2">
              <button
                type="button"
                onClick={() => void handleTourStart()}
                className="h-[40px] w-full rounded-r2 bg-orange-600 font-pretendard text-size-3 font-bold text-gray-00"
              >
                {tourBubble.mode === "start" ? "코스 시작" : "이어서 진행하기"}
              </button>
            </div>

            {/* 봇을 가리키는 꼬리 */}
            <div className="absolute -bottom-[7px] right-[28px] h-[14px] w-[14px] rotate-45 bg-white shadow-[3px_3px_6px_rgba(0,0,0,0.06)]" />
          </div>
        </div>
      ) : null}

      {/* 코스 변경/혼잡 알림 말풍선 (채팅이 닫혀 있을 때) */}
      {showChangeBubble && changeBubble ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[72] mx-auto w-full max-w-[402px]">
          <div className="pointer-events-auto fixed right-[20px] bottom-[170px] w-[min(280px,calc(100%-40px))] rounded-r4 bg-white p-x4 shadow-[0_8px_28px_rgba(0,0,0,0.2)] md:right-[calc((100vw-402px)/2+20px)]">
            <button
              type="button"
              aria-label="알림 닫기"
              onClick={() => setChangeBubble(null)}
              className="absolute right-x2 top-x2 flex h-x6 w-x6 items-center justify-center rounded-full text-size-3 text-gray-400 hover:bg-gray-100"
            >
              ✕
            </button>

            <p className="whitespace-pre-wrap pr-x4 font-pretendard text-size-3 leading-t5 text-gray-1000">
              {changeBubble.text}
            </p>

            <div className="mt-x3 flex flex-col gap-x2">
              {changeBubble.actions.map((a, i) => (
                <button
                  key={a.label}
                  type="button"
                  onClick={() => handleChangeAction(a.reply)}
                  className={
                    i === 0
                      ? "h-[40px] w-full rounded-r2 bg-orange-600 font-pretendard text-size-3 font-bold text-gray-00"
                      : "h-[40px] w-full rounded-r2 border border-gray-300 bg-white font-pretendard text-size-3 font-medium text-gray-700"
                  }
                >
                  {a.label}
                </button>
              ))}
            </div>

            {/* 봇을 가리키는 꼬리 */}
            <div className="absolute -bottom-[7px] right-[28px] h-[14px] w-[14px] rotate-45 bg-white shadow-[3px_3px_6px_rgba(0,0,0,0.06)]" />
          </div>
        </div>
      ) : null}

      {showFloatingButton ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[70] mx-auto w-full max-w-[402px]">
          <button
            type="button"
            aria-label={open ? "AI 큐레이터 닫기" : "AI 큐레이터 채팅 열기"}
            onClick={() => (open ? setOpen(false) : openChat())}
            className="pointer-events-auto fixed right-[20px] bottom-[104px] z-[70] flex h-[56px] w-[56px] items-center justify-center rounded-full bg-orange-200 shadow-[0_4px_12px_rgba(0,0,0,0.18)] md:right-[calc((100vw-402px)/2+20px)]"
          >
            <img
              src={BreadDefaultLogo}
              alt=""
              aria-hidden
              className="h-[36px] w-[36px] object-contain"
            />
          </button>
        </div>
      ) : null}
    </>
  );
}
