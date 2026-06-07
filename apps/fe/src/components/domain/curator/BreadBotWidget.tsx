import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { sendCuratorChat } from "@/api/curator";
import { getCourseDetail, getMyCourseRoutes } from "@/api/courses";
import {
  cancelReservation,
  getMyReservations,
  getReservationById,
  type ReservationSummary,
} from "@/api/reservation";
import {
  checkTourCongestion,
  getCurrentTour,
  startTour,
  type CongestionCheckResult,
} from "@/api/tours";
import { getErrorMessage } from "@/api/types/common";
import { isLoggedIn } from "@/lib/auth/isLoggedIn";
import { useLoginRequired } from "@/lib/auth/useLoginRequired";
import {
  CONGESTION_ACTION_BUTTONS,
  RESERVE_NUDGE_ACTION_BUTTONS,
  type ChatActionButton,
  type ChatButtonAction,
} from "@/types/curatorActions";
import { reorderCourseForCongestion } from "@/utils/courseCongestionActions";
import { buildCongestionCheckReply, isCongestionCheckIntent } from "@/utils/congestionCheck";
import {
  TOUR_REMINDER_WINDOW_MS,
  buildReminderKey,
  hasFiredReminder,
  isReminderEligibleReservation,
  isSameLocalDay,
  markFiredReminder,
  reservationStartMs,
  resolvePreDepartureReminderStage,
} from "@/utils/tourReminders";
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

const CHAT_STORAGE_KEY = "breadbot:chat:v1";
const RESERVE_NUDGE_FIRED_KEY = "bbang_reserve_nudge_fired";

type ChatRole = "user" | "bot";

type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
  actions?: ChatActionButton[];
  quickReplies?: string[];
};

type ActionBubble = {
  text: string;
  actions: ChatActionButton[];
};

type TourBubble = {
  courseId: number;
  courseName: string;
  reservationId?: number;
  mode: "start" | "resume" | "autostart";
  text?: string;
  dismissKey: string;
};

type ReserveNudgeBubble = {
  courseId: number;
  courseName: string;
  dismissKey: string;
};

const CONGESTION_TYPES = new Set(["congestion", "crowd", "busy", "course_alert"]);

function actionsForCuratorType(
  type: string | undefined,
  apiButtons: ChatActionButton[],
): ChatActionButton[] {
  if (apiButtons.length > 0) return apiButtons;
  const normalized = type?.trim().toLowerCase();
  if (normalized && CONGESTION_TYPES.has(normalized)) {
    return CONGESTION_ACTION_BUTTONS;
  }
  return [];
}

type PersistedChat = { messages: ChatMessage[]; conversationId?: string };

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

function hasFiredReserveNudge(key: string): boolean {
  try {
    const raw = localStorage.getItem(RESERVE_NUDGE_FIRED_KEY);
    if (!raw) return false;
    return (JSON.parse(raw) as string[]).includes(key);
  } catch {
    return false;
  }
}

function markFiredReserveNudge(key: string): void {
  try {
    const raw = localStorage.getItem(RESERVE_NUDGE_FIRED_KEY);
    const list = raw ? (JSON.parse(raw) as string[]) : [];
    if (!list.includes(key)) {
      list.push(key);
      localStorage.setItem(RESERVE_NUDGE_FIRED_KEY, JSON.stringify(list));
    }
  } catch {
    // ignore
  }
}

type BreadBotWidgetProps = {
  courseId?: number | null;
  showFloatingButton?: boolean;
};

function ActionButtons({
  actions,
  disabled,
  onAction,
}: {
  actions: ChatActionButton[];
  disabled?: boolean;
  onAction: (action: ChatButtonAction) => void;
}) {
  return (
    <div
      className={cn(
        "grid w-full gap-x1-5 gap-y-x1-5",
        actions.length <= 2 ? "grid-cols-2" : "grid-cols-1",
      )}
    >
      {actions.map((action, index) => (
        <button
          key={`${action.action}-${action.label}`}
          type="button"
          disabled={disabled}
          onClick={() => onAction(action.action)}
          className={
            index === 0
              ? "rounded-r2 border border-orange-200 bg-orange-50 px-x2 py-x1-5 text-center font-pretendard text-size-2 leading-t3 text-orange-700 transition-colors hover:bg-orange-100 disabled:opacity-50"
              : "rounded-r2 border border-gray-300 bg-white px-x2 py-x1-5 text-center font-pretendard text-size-2 leading-t3 text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
          }
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}

export default function BreadBotWidget({
  courseId,
  showFloatingButton = true,
}: BreadBotWidgetProps) {
  const { startCourseGuide } = useLoginRequired();
  const navigate = useNavigate();
  const onTourPage = useRouterState({ select: (s) => s.location.pathname.startsWith("/tour") });
  const onRoutePage = useRouterState({ select: (s) => s.location.pathname === "/route" });

  const [open, setOpen] = useState(false);
  const [persisted] = useState(loadPersistedChat);
  const [messages, setMessages] = useState<ChatMessage[]>(persisted.messages);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string | undefined>(
    persisted.conversationId,
  );
  const [loading, setLoading] = useState(false);
  const [changeBubble, setChangeBubble] = useState<ActionBubble | null>(null);
  const [tourBubble, setTourBubble] = useState<TourBubble | null>(null);
  const [reserveNudgeBubble, setReserveNudgeBubble] = useState<ReserveNudgeBubble | null>(null);

  const dismissedTourRef = useRef<Set<string>>(new Set());
  const lastCongestionResultsRef = useRef<CongestionCheckResult[]>([]);
  const activeReservationIdRef = useRef<number | null>(null);
  const navigateRef = useRef(navigate);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    navigateRef.current = navigate;
  });

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading, open]);

  const appendBotMessage = useCallback((text: string, actions?: ChatActionButton[]) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `b-${Date.now()}`,
        role: "bot",
        text,
        actions,
      },
    ]);
  }, []);

  const handleAutoTourStart = useCallback(
    async (tourCourseId: number, reservationId: number, courseName: string) => {
      startCourseGuide(tourCourseId);
      await startTour(tourCourseId).catch(() => undefined);
      setTourBubble({
        courseId: tourCourseId,
        courseName,
        reservationId,
        mode: "autostart",
        text: `'${courseName || "코스"}' 예약 시간이에요! 🍞\n빵 투어를 시작할게요.`,
        dismissKey: buildReminderKey("autostart", reservationId, Date.now()),
      });
      navigateRef.current({ to: "/tour", search: { courseId: tourCourseId } });
    },
    [startCourseGuide],
  );

  useEffect(() => {
    if (!isLoggedIn()) return;
    let cancelled = false;

    const check = async () => {
      try {
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
          setReserveNudgeBubble(null);
          return;
        }

        const reservations = await getMyReservations();
        if (cancelled) return;

        const now = Date.now();
        let candidate: { r: ReservationSummary; start: number } | null = null;
        for (const reservation of reservations) {
          if (!isReminderEligibleReservation(reservation.status)) continue;
          const start = reservationStartMs(reservation.departureDate, reservation.departureTime);
          if (start == null) continue;
          if (now > start + TOUR_REMINDER_WINDOW_MS) continue;
          if (!isSameLocalDay(now, start)) continue;
          if (!candidate || start < candidate.start) candidate = { r: reservation, start };
        }

        if (candidate) {
          const { r, start } = candidate;
          activeReservationIdRef.current = r.id;

          if (now >= start) {
            const autoKey = buildReminderKey("autostart", r.id, start);
            if (!hasFiredReminder(autoKey)) {
              markFiredReminder(autoKey);
              const detail = await getReservationById(r.id);
              if (cancelled) return;
              await handleAutoTourStart(detail.course.id, r.id, detail.course.name);
            }
            setReserveNudgeBubble(null);
            return;
          }

          const stage = resolvePreDepartureReminderStage(r, start, now);
          if (stage && !hasFiredReminder(stage.key) && !dismissedTourRef.current.has(stage.key)) {
            const detail = await getReservationById(r.id);
            if (cancelled) return;
            markFiredReminder(stage.key);
            setTourBubble({
              courseId: detail.course.id,
              courseName: detail.course.name,
              reservationId: r.id,
              mode: "start",
              text: stage.buildText(detail.course.name, r.departureTime),
              dismissKey: stage.key,
            });
          } else if (!stage) {
            setTourBubble(null);
          }

          setReserveNudgeBubble(null);
          return;
        }

        activeReservationIdRef.current = null;
        setTourBubble(null);

        const routes = await getMyCourseRoutes();
        if (cancelled || routes.length === 0) {
          setReserveNudgeBubble(null);
          return;
        }

        const activeReservations = reservations.filter(
          (reservation) =>
            reservation.status === "CONFIRMED" ||
            reservation.status === "PENDING" ||
            reservation.status === "IN_PROGRESS",
        );
        const reservationDetails = await Promise.all(
          activeReservations.map((reservation) =>
            getReservationById(reservation.id).catch(() => null),
          ),
        );
        if (cancelled) return;

        const bookedCourseIds = new Set(
          reservationDetails
            .filter((detail): detail is NonNullable<typeof detail> => detail != null)
            .map((detail) => detail.course.id),
        );

        const unbookedRoute = routes.find((route) => !bookedCourseIds.has(route.courseId));
        if (!unbookedRoute) {
          setReserveNudgeBubble(null);
          return;
        }

        const nudgeKey = `reserve-nudge:${unbookedRoute.courseId}`;
        if (hasFiredReserveNudge(nudgeKey) || dismissedTourRef.current.has(nudgeKey)) {
          setReserveNudgeBubble(null);
          return;
        }

        if (onRoutePage || (courseId != null && courseId === unbookedRoute.courseId)) {
          markFiredReserveNudge(nudgeKey);
          setReserveNudgeBubble({
            courseId: unbookedRoute.courseId,
            courseName: unbookedRoute.name,
            dismissKey: nudgeKey,
          });
          return;
        }

        setReserveNudgeBubble(null);
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
  }, [courseId, handleAutoTourStart, onRoutePage]);

  useEffect(() => {
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify({ messages, conversationId }));
    } catch {
      // ignore
    }
  }, [messages, conversationId]);

  const handleButtonAction = useCallback(
    async (action: ChatButtonAction, targetCourseId?: number | null) => {
      const resolvedCourseId = targetCourseId ?? courseId ?? null;

      switch (action) {
        case "keep_course":
          appendBotMessage("그대로 진행할게요. 현재 코스대로 안내해 드릴게요! 🍞");
          setChangeBubble(null);
          return;

        case "change_course": {
          if (!resolvedCourseId || resolvedCourseId <= 0) {
            appendBotMessage("코스 정보를 찾을 수 없어요. 투어 화면에서 다시 시도해 주세요.");
            return;
          }
          setLoading(true);
          try {
            const { movedBakeryName } = await reorderCourseForCongestion(
              resolvedCourseId,
              lastCongestionResultsRef.current,
            );
            appendBotMessage(
              movedBakeryName
                ? `혼잡한 '${movedBakeryName}'을(를) 코스 뒤쪽으로 옮겼어요. 변경된 순서로 안내해 드릴게요!`
                : "코스 순서를 변경했어요. 변경된 순서로 안내해 드릴게요!",
            );
          } catch (error) {
            appendBotMessage(getErrorMessage(error));
          } finally {
            setLoading(false);
            setChangeBubble(null);
          }
          return;
        }

        case "cancel_reservation": {
          const reservationId = activeReservationIdRef.current;
          if (reservationId == null) {
            appendBotMessage("취소할 예약을 찾을 수 없어요. 예약 상세에서 다시 시도해 주세요.");
            return;
          }
          if (!window.confirm("예약을 취소할까요?")) return;

          setLoading(true);
          try {
            await cancelReservation(reservationId);
            activeReservationIdRef.current = null;
            appendBotMessage("예약이 취소되었어요.");
          } catch {
            appendBotMessage("예약 취소에 실패했어요. 다시 시도해주세요.");
          } finally {
            setLoading(false);
            setChangeBubble(null);
          }
          return;
        }

        case "reserve_taxi": {
          if (!resolvedCourseId || resolvedCourseId <= 0) return;
          setReserveNudgeBubble(null);
          void navigate({ to: "/taxi-reserve", search: { courseId: resolvedCourseId } });
          return;
        }
      }
    },
    [appendBotMessage, courseId, navigate],
  );

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
        if (courseId && courseId > 0 && isCongestionCheckIntent(text)) {
          const course = await getCourseDetail(courseId);
          const bakeryIds = course.bakeries.map((bakery) => bakery.id).filter((id) => id > 0);
          if (bakeryIds.length === 0) {
            throw new Error("코스에 빵집 정보가 없어 혼잡도를 확인할 수 없습니다.");
          }

          const res = await checkTourCongestion({ courseId, bakeryIds });
          lastCongestionResultsRef.current = res.data ?? [];
          const { text: replyText, isCongestionAlert } = buildCongestionCheckReply(res);
          const actions = isCongestionAlert ? CONGESTION_ACTION_BUTTONS : [];

          setMessages((prev) => [
            ...prev,
            {
              id: `congestion-${Date.now()}`,
              role: "bot",
              text: replyText,
              actions,
            },
          ]);
          if (actions.length > 0) {
            setChangeBubble({ text: replyText, actions });
          }
          return;
        }

        const res = await sendCuratorChat({
          message: text,
          courseId: courseId ?? undefined,
          conversationId,
        });
        setConversationId(res.conversationId);
        const actions = actionsForCuratorType(res.type, res.buttons);
        setMessages((prev) => [
          ...prev,
          {
            id: res.messageId || `b-${Date.now()}`,
            role: "bot",
            text: res.message,
            actions,
          },
        ]);
        if (actions.length > 0) {
          setChangeBubble({ text: res.message, actions });
        }
      } catch (e) {
        appendBotMessage(getErrorMessage(e));
      } finally {
        setLoading(false);
      }
    })();
  };

  const handleSend = () => sendMessage(input);

  const handleQuickReply = (label: string) => {
    sendMessage(label);
  };

  const showGuide = () => {
    setMessages((prev) => [
      ...prev,
      {
        id: `guide-${Date.now()}`,
        role: "bot",
        text: "무엇이 궁금하세요? 아래에서 골라보세요 🍞",
        quickReplies: [...QUICK_REPLIES],
      },
    ]);
  };

  const handleChangeAction = (action: ChatButtonAction) => {
    setChangeBubble(null);
    setOpen(true);
    void handleButtonAction(action);
  };

  const handleTourStart = async () => {
    if (!tourBubble) return;
    const { courseId: tourCourseId, mode } = tourBubble;
    setTourBubble(null);
    startCourseGuide(tourCourseId);
    if (mode === "start" || mode === "autostart") {
      await startTour(tourCourseId).catch(() => undefined);
    }
    void navigate({ to: "/tour", search: { courseId: tourCourseId } });
  };

  const dismissTourBubble = () => {
    if (tourBubble) dismissedTourRef.current.add(tourBubble.dismissKey);
    setTourBubble(null);
  };

  const dismissReserveNudge = () => {
    if (reserveNudgeBubble) {
      dismissedTourRef.current.add(reserveNudgeBubble.dismissKey);
      markFiredReserveNudge(reserveNudgeBubble.dismissKey);
    }
    setReserveNudgeBubble(null);
  };

  const showTourBubble = tourBubble !== null && !open && !onTourPage;
  const showChangeBubble =
    tourBubble === null && reserveNudgeBubble === null && changeBubble !== null && !open;
  const showReserveNudgeBubble =
    tourBubble === null &&
    changeBubble === null &&
    reserveNudgeBubble !== null &&
    !open &&
    !onTourPage;

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

                  {m.role === "bot" && m.quickReplies && m.quickReplies.length > 0 ? (
                    <div className="grid w-full max-w-[85%] grid-cols-2 gap-x1-5 gap-y-x1-5">
                      {m.quickReplies.map((reply) => (
                        <button
                          key={reply}
                          type="button"
                          disabled={loading}
                          onClick={() => handleQuickReply(reply)}
                          className="rounded-r2 border border-orange-200 bg-orange-50 px-x2 py-x1-5 text-center font-pretendard text-size-2 leading-t3 text-orange-700 transition-colors hover:bg-orange-100 disabled:opacity-50"
                        >
                          {reply}
                        </button>
                      ))}
                    </div>
                  ) : null}

                  {m.role === "bot" && m.actions && m.actions.length > 0 ? (
                    <div className="w-full max-w-[85%]">
                      <ActionButtons
                        actions={m.actions}
                        disabled={loading}
                        onAction={(action) => void handleButtonAction(action)}
                      />
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
                (tourBubble.mode === "start" || tourBubble.mode === "autostart"
                  ? `예약하신 '${tourBubble.courseName || "코스"}' 출발 시간이에요!\n지금 빵 투어를 시작할까요? 🍞`
                  : "진행 중인 빵 투어가 있어요.\n이어서 진행할까요?")}
            </p>

            <div className="mt-x3 flex flex-col gap-x2">
              <button
                type="button"
                onClick={() => void handleTourStart()}
                className="h-[40px] w-full rounded-r2 bg-orange-600 font-pretendard text-size-3 font-bold text-gray-00"
              >
                {tourBubble.mode === "resume" ? "이어서 진행하기" : "코스 시작"}
              </button>
            </div>

            <div className="absolute -bottom-[7px] right-[28px] h-[14px] w-[14px] rotate-45 bg-white shadow-[3px_3px_6px_rgba(0,0,0,0.06)]" />
          </div>
        </div>
      ) : null}

      {showReserveNudgeBubble && reserveNudgeBubble ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[72] mx-auto w-full max-w-[402px]">
          <div className="pointer-events-auto fixed right-[20px] bottom-[170px] w-[min(280px,calc(100%-40px))] rounded-r4 bg-white p-x4 shadow-[0_8px_28px_rgba(0,0,0,0.2)] md:right-[calc((100vw-402px)/2+20px)]">
            <button
              type="button"
              aria-label="알림 닫기"
              onClick={dismissReserveNudge}
              className="absolute right-x2 top-x2 flex h-x6 w-x6 items-center justify-center rounded-full text-size-3 text-gray-400 hover:bg-gray-100"
            >
              ✕
            </button>

            <p className="whitespace-pre-wrap pr-x4 font-pretendard text-size-3 leading-t5 text-gray-1000">
              {`저장된 '${reserveNudgeBubble.courseName || "코스"}'은(는) 아직 예약되지 않았어요.\n예약을 완료하면 당일 알림과 자동 투어 안내를 받을 수 있어요.`}
            </p>

            <div className="mt-x3">
              <ActionButtons
                actions={RESERVE_NUDGE_ACTION_BUTTONS}
                onAction={(action) => void handleButtonAction(action, reserveNudgeBubble.courseId)}
              />
            </div>

            <div className="absolute -bottom-[7px] right-[28px] h-[14px] w-[14px] rotate-45 bg-white shadow-[3px_3px_6px_rgba(0,0,0,0.06)]" />
          </div>
        </div>
      ) : null}

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

            <div className="mt-x3">
              <ActionButtons
                actions={changeBubble.actions}
                disabled={loading}
                onAction={handleChangeAction}
              />
            </div>

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
            className="pointer-events-auto fixed right-[20px] bottom-[104px] z-[70] flex h-[56px] w-[56px] items-center justify-center rounded-full bg-orange-600 shadow-[0_4px_12px_rgba(0,0,0,0.18)] md:right-[calc((100vw-402px)/2+20px)]"
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
