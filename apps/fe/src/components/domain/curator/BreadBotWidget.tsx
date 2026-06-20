import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { sendCuratorChat } from "@/api/curator";
import { getBakeryById } from "@/api/bakery";
import { getCourseDetail, getMyCourseRoutes } from "@/api/courses";
import {
  cancelReservation,
  getMyReservations,
  getReservationById,
  type ReservationSummary,
} from "@/api/reservation";
import {
  checkTourCongestion,
  checkTourVisit,
  completeTour,
  getCurrentTour,
  startTour,
  type CongestionCheckResult,
} from "@/api/tours";
import { getErrorMessage } from "@/api/types/common";
import { isLoggedIn } from "@/lib/auth/isLoggedIn";
import { useLoginRequired } from "@/lib/auth/useLoginRequired";
import {
  trackBakeryVisitChecked,
  trackCuratorGuideClicked,
  trackCuratorOpened,
  trackTourStarted,
} from "@/lib/analytics/gtag";
import {
  CONGESTION_ACTION_BUTTONS,
  RESERVE_NUDGE_ACTION_BUTTONS,
  buildCongestionChatButtons,
  type ChatActionButton,
} from "@/types/curatorActions";
import { reorderCourseForCongestion, swapBakeryInCourse } from "@/utils/courseCongestionActions";
import {
  buildBakeryNameLookup,
  buildCongestionChatMessage,
  buildCongestionCheckReply,
  findAlternativeBakerySuggestion,
  findPrimaryCongestionAlert,
  isCongestionAlertResult,
  isCongestionCheckIntent,
} from "@/utils/congestionCheck";
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
import {
  notifyTourCompleteCelebration,
  readPendingTourCompleteCelebration,
  TOUR_COMPLETE_EVENT,
} from "@/utils/tourCelebration";
import { saveTourCelebrationRecord } from "@/utils/tourCelebrationInbox";
import { saveRouteFocusCourseId } from "@/utils/aiCourseStorage";
import { cn } from "@/utils/cn";
import { useTourArrivalProximity, type TourArrivalPrompt } from "@/hooks/useTourArrivalProximity";
import ChatBotImage from "@/assets/images/Img_ChatBot.svg";
import ChatbotCourseSpeechBubble from "@/components/domain/curator/ChatbotCourseSpeechBubble";
import {
  CHATBOT_FAB_SIZE,
  resolveChatbotBubblePositionClass,
  resolveChatbotFabPositionClass,
  resolveChatbotInlineBubblePositionClass,
} from "@/components/domain/curator/chatbotFabLayout";
import BreadBotChatModal from "@/components/domain/curator/BreadBotChatModal";
import BreadBotConfetti from "@/components/domain/curator/BreadBotConfetti";
import {
  buildCourseExplainMessage,
  buildTourCompleteCelebrationMessage,
  COURSE_NOT_IN_PROGRESS_MESSAGE,
  getBreadBotErrorMessage,
  isCourseCancelIntent,
  isCourseExplainIntent,
  isCourseReorderIntent,
  isNextBakeryRecommendIntent,
  type ChatMessage,
  type CongestionChatContext,
  type CourseMovementBubble,
} from "@/components/domain/curator/breadBotChat.types";
import ActiveTourConflictDialog from "@/components/common/dialog/ActiveTourConflictDialog";
import { hasConflictingActiveTour } from "@/utils/activeTourGuard";

const CHAT_STORAGE_KEY = "breadbot:chat:v1";
const RESERVE_NUDGE_FIRED_KEY = "bbang_reserve_nudge_fired";

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

type AppendBotMessageOptions = {
  actions?: ChatActionButton[];
  showBakeryInfoId?: number;
  showSadBread?: boolean;
  congestionContext?: CongestionChatContext;
};

function buildCongestionChatBotMessage(
  results: CongestionCheckResult[],
  bakeryNamesById: Map<number, string>,
): Omit<ChatMessage, "id" | "role"> | null {
  const primaryAlert = findPrimaryCongestionAlert(results);
  if (!primaryAlert) return null;

  const congestedName =
    bakeryNamesById.get(primaryAlert.bakeryId) ??
    primaryAlert.bakeryName?.trim() ??
    "방문 예정 빵집";
  const alternative = findAlternativeBakerySuggestion(results, primaryAlert, bakeryNamesById);

  if (!alternative) {
    return {
      text: `지금 ${congestedName} 웨이팅이 너무 길어서 빵을 먹기 어려울 것 같아요 ㅠㅠ\n\n다른 빵집을 찾지 못했어요. 기존 코스로 안내해 드릴게요.`,
      actions: [{ label: "기존 코스로 안내", action: "keep_course" }],
      showSadBread: true,
    };
  }

  return {
    text: buildCongestionChatMessage(primaryAlert, alternative, bakeryNamesById),
    actions: buildCongestionChatButtons(alternative.bakeryName, alternative.bakeryId),
    showSadBread: true,
    congestionContext: {
      congestedBakeryId: primaryAlert.bakeryId,
      congestedBakeryName: congestedName,
      alternativeBakeryId: alternative.bakeryId,
      alternativeBakeryName: alternative.bakeryName,
    },
  };
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

async function resolveChatCourseId(courseId?: number | null): Promise<number | null> {
  if (courseId != null && courseId > 0) return courseId;

  try {
    const tour = await getCurrentTour();
    if (tour?.status === "IN_PROGRESS" && tour.courseId > 0) {
      return tour.courseId;
    }
  } catch {
    /* ignore */
  }

  return null;
}

async function buildCourseReorderReply(
  resolvedCourseId: number,
  lastCongestionResultsRef: { current: CongestionCheckResult[] },
  lastCongestionContextRef: { current: CongestionChatContext | null },
): Promise<Omit<ChatMessage, "id" | "role"> | null> {
  const course = await getCourseDetail(resolvedCourseId);
  const bakeryIds = course.bakeries.map((bakery) => bakery.id).filter((id) => id > 0);
  if (bakeryIds.length === 0) {
    throw new Error("코스에 빵집 정보가 없어 순서를 변경할 수 없습니다.");
  }

  const res = await checkTourCongestion({ courseId: resolvedCourseId, bakeryIds });
  const results = res.data ?? [];
  lastCongestionResultsRef.current = results;
  const bakeryNamesById = buildBakeryNameLookup(course.bakeries);
  const congestionMessage = buildCongestionChatBotMessage(results, bakeryNamesById);

  if (congestionMessage) {
    if (congestionMessage.congestionContext) {
      lastCongestionContextRef.current = congestionMessage.congestionContext;
    }
    return congestionMessage;
  }

  return {
    text: `${buildCourseExplainMessage(course)}\n\n지금은 혼잡한 빵집이 없어요. 위 순서 그대로 진행해도 괜찮아 보여요!`,
    showCourseMap: true,
  };
}

async function buildNextBakeryRecommendReply(
  resolvedCourseId: number,
  lastCongestionResultsRef: { current: CongestionCheckResult[] },
  lastCongestionContextRef: { current: CongestionChatContext | null },
): Promise<Omit<ChatMessage, "id" | "role">> {
  const course = await getCourseDetail(resolvedCourseId);
  const bakeries = course.bakeries ?? [];
  if (bakeries.length === 0) {
    throw new Error("코스에 빵집 정보가 없어 추천할 수 없습니다.");
  }

  const tour = await getCurrentTour();
  let nextIndex = 0;
  if (tour?.status === "IN_PROGRESS" && tour.courseId === resolvedCourseId) {
    nextIndex = tour.currentVisitOrder ?? 0;
  }

  const nextBakery = bakeries[nextIndex];
  if (!nextBakery) {
    return {
      text: "코스의 모든 빵집 방문을 마쳤어요! 오늘 빵 투어도 수고하셨어요 🍞",
    };
  }

  const bakeryIds = bakeries.map((bakery) => bakery.id).filter((id) => id > 0);
  const res = await checkTourCongestion({ courseId: resolvedCourseId, bakeryIds });
  const results = res.data ?? [];
  lastCongestionResultsRef.current = results;

  const bakeryNamesById = buildBakeryNameLookup(bakeries);
  const nextName = nextBakery.name?.trim() || `빵집 ${nextIndex + 1}`;
  const lines = [
    `다음 방문 추천은 코스 ${nextIndex + 1}/${bakeries.length}번째 빵집 '${nextName}'이에요!`,
  ];

  if (nextBakery.address?.trim()) {
    lines.push(`📍 ${nextBakery.address.trim()}`);
  }
  if (Number.isFinite(nextBakery.rating) && nextBakery.rating > 0) {
    lines.push(`⭐ 평점 ${nextBakery.rating}`);
  }

  const nextCongestion = results.find((item) => item.bakeryId === nextBakery.id);
  if (nextCongestion && isCongestionAlertResult(nextCongestion)) {
    const waitText =
      nextCongestion.expectedWaitMin != null && nextCongestion.expectedWaitMin > 0
        ? ` 예상 대기 약 ${nextCongestion.expectedWaitMin}분`
        : "";
    lines.push("", `지금 ${nextName}은(는) 혼잡해요.${waitText}`);

    const upcomingBakeryIds = new Set(bakeries.slice(nextIndex + 1).map((bakery) => bakery.id));
    const upcomingResults = results.filter((item) => upcomingBakeryIds.has(item.bakeryId));
    const alternative = findAlternativeBakerySuggestion(
      upcomingResults,
      nextCongestion,
      bakeryNamesById,
    );

    if (alternative) {
      lines.push(
        "",
        `같은 코스 안에서는 '${alternative.bakeryName}'을(를) 먼저 방문하면 대기 시간을 줄일 수 있어요.`,
      );
      lastCongestionContextRef.current = {
        congestedBakeryId: nextBakery.id,
        congestedBakeryName: nextName,
        alternativeBakeryId: alternative.bakeryId,
        alternativeBakeryName: alternative.bakeryName,
      };
      return {
        text: lines.join("\n"),
        actions: buildCongestionChatButtons(alternative.bakeryName, alternative.bakeryId),
        showSadBread: true,
        showCourseMap: true,
        congestionContext: lastCongestionContextRef.current,
      };
    }

    lines.push("", "코스를 중단하고 싶다면 '코스 취소하기'를 눌러주세요.");
  } else {
    lines.push("", "지금은 웨이팅이 길지 않아 보여요. 편하게 방문해 보세요!");
  }

  const upcomingNames = bakeries
    .slice(nextIndex + 1)
    .map(
      (bakery, index) =>
        `${nextIndex + index + 2}. ${bakery.name?.trim() || `빵집 ${nextIndex + index + 2}`}`,
    )
    .join("\n");
  if (upcomingNames) {
    lines.push("", "이후 코스 방문 예정:", upcomingNames);
  }

  return {
    text: lines.join("\n"),
    showCourseMap: true,
  };
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
  onAction: (button: ChatActionButton) => void;
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
          key={`${action.action}-${action.label}-${action.bakeryId ?? ""}`}
          type="button"
          disabled={disabled}
          onClick={() => onAction(action)}
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
  const {
    startCourseGuide,
    endCourseGuide,
    courseGuideActive,
    startCelebrationPending,
    acknowledgeCelebration,
    pendingCelebrationCourseId,
  } = useLoginRequired();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const onTourPage = pathname.startsWith("/tour");
  const onRoutePage = pathname === "/route";
  const onHomePage = pathname === "/home";
  const fabPositionClass = resolveChatbotFabPositionClass(pathname);
  const bubblePositionClass = resolveChatbotBubblePositionClass(pathname);
  const inlineBubblePositionClass = resolveChatbotInlineBubblePositionClass(pathname);

  const [open, setOpen] = useState(false);
  const [persisted] = useState(loadPersistedChat);
  const [messages, setMessages] = useState<ChatMessage[]>(persisted.messages);
  const [conversationId, setConversationId] = useState<string | undefined>(
    persisted.conversationId,
  );
  const [loading, setLoading] = useState(false);
  const [changeBubble, setChangeBubble] = useState<ActionBubble | null>(null);
  const [tourBubble, setTourBubble] = useState<TourBubble | null>(null);
  const [reserveNudgeBubble, setReserveNudgeBubble] = useState<ReserveNudgeBubble | null>(null);
  const [courseMovementBubble, setCourseMovementBubble] = useState<CourseMovementBubble | null>(
    null,
  );
  const [showConfetti, setShowConfetti] = useState(false);
  /** 진행 중(IN_PROGRESS)인 투어의 courseId — 챗봇 모달의 투어 진행 탭에 사용 */
  const [activeTourCourseId, setActiveTourCourseId] = useState<number | null>(null);
  /** 투어 완료 축하 말풍선 (홈 도착 시 컨페티와 함께 표시) */
  const [celebrationBubble, setCelebrationBubble] = useState<{ courseName: string } | null>(null);
  const [arrivalBusy, setArrivalBusy] = useState(false);
  const [arrivalRecheckNonce, setArrivalRecheckNonce] = useState(0);
  const [activeTourConflictOpen, setActiveTourConflictOpen] = useState(false);

  const dismissedTourRef = useRef<Set<string>>(new Set());
  const dismissedArrivalRef = useRef<Set<string>>(new Set());
  const arrivalVisitInFlightRef = useRef(false);
  const celebratedTourRef = useRef<Set<string>>(new Set());
  const dismissedMovementRef = useRef<Set<string>>(new Set());
  const lastCongestionResultsRef = useRef<CongestionCheckResult[]>([]);
  const lastCongestionContextRef = useRef<CongestionChatContext | null>(null);
  const injectedCongestionKeyRef = useRef<string | null>(null);
  const activeReservationIdRef = useRef<number | null>(null);
  const navigateRef = useRef(navigate);
  const listRef = useRef<HTMLDivElement>(null);

  const effectiveTourCourseId =
    courseGuideActive && (courseId ?? activeTourCourseId) && (courseId ?? activeTourCourseId)! > 0
      ? (courseId ?? activeTourCourseId)!
      : null;

  const isArrivalDismissed = useCallback((key: string) => dismissedArrivalRef.current.has(key), []);

  const tourArrivalPrompt = useTourArrivalProximity(
    courseGuideActive && showFloatingButton,
    effectiveTourCourseId,
    isArrivalDismissed,
    arrivalRecheckNonce,
  );

  useEffect(() => {
    navigateRef.current = navigate;
  });

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading, open]);

  useEffect(() => {
    if (!open || !courseGuideActive || !courseMovementBubble) return;
    if (!courseMovementBubble.title.includes("혼잡")) return;
    if (injectedCongestionKeyRef.current === courseMovementBubble.dismissKey) return;

    let cancelled = false;

    void (async () => {
      if (!courseId || courseId <= 0) return;

      try {
        const course = await getCourseDetail(courseId);
        const bakeryIds = course.bakeries.map((bakery) => bakery.id).filter((id) => id > 0);
        if (bakeryIds.length === 0) return;

        const res = await checkTourCongestion({ courseId, bakeryIds });
        if (cancelled) return;

        const results = res.data ?? [];
        lastCongestionResultsRef.current = results;
        const bakeryNamesById = buildBakeryNameLookup(course.bakeries);
        const congestionMessage = buildCongestionChatBotMessage(results, bakeryNamesById);
        if (!congestionMessage) return;

        if (congestionMessage.congestionContext) {
          lastCongestionContextRef.current = congestionMessage.congestionContext;
        }

        setMessages((prev) => {
          const congestedBakeryId = congestionMessage.congestionContext?.congestedBakeryId;
          if (
            congestedBakeryId != null &&
            prev.some(
              (message) => message.congestionContext?.congestedBakeryId === congestedBakeryId,
            )
          ) {
            return prev;
          }

          return [
            ...prev,
            {
              id: `congestion-auto-${Date.now()}`,
              role: "bot",
              ...congestionMessage,
            },
          ];
        });

        injectedCongestionKeyRef.current = courseMovementBubble.dismissKey;
      } catch {
        // ignore
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, courseGuideActive, courseMovementBubble, courseId]);

  const appendBotMessage = useCallback((text: string, options?: AppendBotMessageOptions) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `b-${Date.now()}`,
        role: "bot",
        text,
        actions: options?.actions,
        showBakeryInfoId: options?.showBakeryInfoId,
        showSadBread: options?.showSadBread,
        congestionContext: options?.congestionContext,
      },
    ]);
  }, []);

  const handleAutoTourStart = useCallback(
    async (tourCourseId: number, reservationId: number, courseName: string) => {
      if (await hasConflictingActiveTour(tourCourseId)) {
        setActiveTourConflictOpen(true);
        return;
      }
      startCourseGuide(tourCourseId);
      trackTourStarted(tourCourseId);
      await startTour(tourCourseId).catch(() => undefined);
      setActiveTourCourseId(tourCourseId);
      celebratedTourRef.current.delete(`celebrated:${tourCourseId}`);
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

  const celebrateTourComplete = useCallback(
    async (completedCourseId: number, options?: { force?: boolean }) => {
      const key = `celebrated:${completedCourseId}`;
      // force: 방금 완료 이벤트가 발생한 경우 — 같은 코스를 다시 완료해도 항상 축하
      if (options?.force) celebratedTourRef.current.delete(key);
      if (celebratedTourRef.current.has(key)) return;
      celebratedTourRef.current.add(key);

      setTourBubble((prev) => (prev?.mode === "resume" ? null : prev));
      setCourseMovementBubble(null);
      setActiveTourCourseId(null);

      let courseName = "";
      try {
        const course = await getCourseDetail(completedCourseId);
        courseName = course.name?.trim() || "";
      } catch {
        /* ignore */
      }

      setShowConfetti(true);
      const celebrationMessage = buildTourCompleteCelebrationMessage(courseName);
      saveTourCelebrationRecord({
        courseId: completedCourseId,
        courseName: courseName || "오늘의 빵 투어",
        message: celebrationMessage,
      });
      setMessages((prev) => {
        const celebrationIdPrefix = `tour-complete-${completedCourseId}`;
        // 같은 완료 건의 중복 추가만 막고, 새로 완료한 투어는 다시 축하한다 (id에 timestamp 포함)
        const filtered = prev.filter((message) => !message.id.startsWith(celebrationIdPrefix));
        return [
          ...filtered,
          {
            id: `${celebrationIdPrefix}-${Date.now()}`,
            role: "bot" as const,
            text: celebrationMessage,
            showCelebration: true,
          },
        ];
      });
      // 챗봇을 강제로 열지 않고, FAB 위 축하 말풍선으로 안내 (채팅을 열면 전체 축하 메시지 표시)
      setCelebrationBubble({ courseName });
    },
    [],
  );

  const clearResumeTourBubble = useCallback(() => {
    setTourBubble((prev) => (prev?.mode === "resume" ? null : prev));
  }, []);

  // 투어 완료 후 홈에 도착하면 보류 중인 축하를 실행 (이벤트를 놓친 경우 대비)
  useEffect(() => {
    if (!onHomePage) return;
    const pendingCelebrationId = readPendingTourCompleteCelebration();
    if (pendingCelebrationId) {
      void celebrateTourComplete(pendingCelebrationId);
    }
  }, [onHomePage, celebrateTourComplete]);

  useEffect(() => {
    const handleTourComplete = (event: Event) => {
      const courseIdFromEvent = (event as CustomEvent<{ courseId?: number }>).detail?.courseId;
      if (courseIdFromEvent && courseIdFromEvent > 0) {
        void celebrateTourComplete(courseIdFromEvent, { force: true });
      }
    };

    window.addEventListener(TOUR_COMPLETE_EVENT, handleTourComplete);
    return () => window.removeEventListener(TOUR_COMPLETE_EVENT, handleTourComplete);
  }, [celebrateTourComplete]);

  useEffect(() => {
    if (!pendingCelebrationCourseId || pendingCelebrationCourseId <= 0) return;
    void celebrateTourComplete(pendingCelebrationCourseId);
  }, [pendingCelebrationCourseId, celebrateTourComplete]);

  useEffect(() => {
    if (!isLoggedIn()) return;
    let cancelled = false;

    const check = async () => {
      try {
        const current = await getCurrentTour().catch(() => null);
        if (cancelled) return;

        setActiveTourCourseId(
          current?.status === "IN_PROGRESS" && current.courseId > 0 ? current.courseId : null,
        );

        // 새 투어가 시작되면 같은 코스도 완료 시 다시 축하할 수 있도록 기록 해제
        if (current?.status === "IN_PROGRESS") {
          celebratedTourRef.current.delete(`celebrated:${current.courseId}`);
        }

        if (current?.status === "COMPLETED") {
          // 축하는 홈 도착 시(보류 마크 소비)에만 실행 — 여기서는 버블 정리만
          clearResumeTourBubble();
          setCourseMovementBubble(null);
        } else if (!current || current.status !== "IN_PROGRESS") {
          clearResumeTourBubble();
        }

        if (current?.status === "IN_PROGRESS") {
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
        clearResumeTourBubble();
      }
    };

    void check();
    const timer = setInterval(() => void check(), 60_000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [celebrateTourComplete, clearResumeTourBubble, courseId, handleAutoTourStart, onRoutePage]);

  const applyCourseMovementBubble = useCallback((next: CourseMovementBubble | null) => {
    if (next && dismissedMovementRef.current.has(next.dismissKey)) return;
    setCourseMovementBubble(next);
  }, []);

  /** 코스 안내 중 — 다음 방문 빵집 이동·혼잡도 말풍선 (챗봇 FAB 위 4px) */
  useEffect(() => {
    if (!courseGuideActive || !courseId || courseId <= 0) {
      setCourseMovementBubble(null);
      return undefined;
    }

    let cancelled = false;

    const refresh = async () => {
      try {
        const current = await getCurrentTour();
        if (cancelled) return;

        if (!current || current.status !== "IN_PROGRESS" || current.courseId !== courseId) {
          setCourseMovementBubble(null);
          return;
        }

        const course = await getCourseDetail(courseId);
        if (cancelled) return;

        const visited = current.currentVisitOrder ?? 0;
        const nextBakery = course.bakeries[visited];
        if (!nextBakery) {
          setCourseMovementBubble(null);
          return;
        }

        const bakeryName = nextBakery.name?.trim() || `빵집 ${visited + 1}`;
        const bakeryIds = course.bakeries.map((bakery) => bakery.id).filter((id) => id > 0);

        let title = `${bakeryName}으로 이동중...`;
        let subtitle = "예상 웨이팅을 확인해보세요";
        let dismissKey = `moving:${courseId}:${visited}`;

        try {
          const res = await checkTourCongestion({
            courseId,
            bakeryIds,
            targetBakeryId: nextBakery.id,
          });
          if (cancelled) return;

          lastCongestionResultsRef.current = res.data ?? [];
          const { isCongestionAlert, primaryAlert } = buildCongestionCheckReply(res, {
            bakeryNamesById: buildBakeryNameLookup(course.bakeries),
          });

          if (isCongestionAlert && primaryAlert) {
            title = `${bakeryName} 혼잡해요`;
            dismissKey = `congestion:${courseId}:${nextBakery.id}:${primaryAlert.level ?? ""}:${primaryAlert.expectedWaitMin ?? 0}`;
            subtitle =
              primaryAlert.expectedWaitMin != null && primaryAlert.expectedWaitMin > 0
                ? `예상 대기 약 ${primaryAlert.expectedWaitMin}분 · 코스를 확인해보세요`
                : "예상 웨이팅을 확인해보세요";
          }
        } catch {
          /* 이동 안내 문구 유지 */
        }

        applyCourseMovementBubble({ title, subtitle, dismissKey });
      } catch {
        if (!cancelled) setCourseMovementBubble(null);
      }
    };

    void refresh();
    const timer = window.setInterval(() => void refresh(), 30_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [applyCourseMovementBubble, courseGuideActive, courseId]);

  useEffect(() => {
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify({ messages, conversationId }));
    } catch {
      // ignore
    }
  }, [messages, conversationId]);

  const handleButtonAction = useCallback(
    async (button: ChatActionButton, targetCourseId?: number | null) => {
      const action = button.action;
      const resolvedCourseId = targetCourseId ?? courseId ?? null;

      switch (action) {
        case "keep_course":
          appendBotMessage("기존 코스로 안내해 드릴게요! 🍞");
          setChangeBubble(null);
          return;

        case "view_bakery_info": {
          if (!button.bakeryId || button.bakeryId <= 0) return;
          setLoading(true);
          try {
            const bakery = await getBakeryById(button.bakeryId);
            appendBotMessage(`${bakery.name} 정보를 확인해 보세요!`, {
              showBakeryInfoId: button.bakeryId,
            });
          } catch (error) {
            appendBotMessage(getErrorMessage(error));
          } finally {
            setLoading(false);
            setChangeBubble(null);
          }
          return;
        }

        case "swap_bakery": {
          const context = lastCongestionContextRef.current;
          const alternativeBakeryId = button.bakeryId ?? context?.alternativeBakeryId;
          if (!resolvedCourseId || resolvedCourseId <= 0 || !context || !alternativeBakeryId) {
            appendBotMessage("코스 정보를 찾을 수 없어요. 투어 화면에서 다시 시도해 주세요.");
            return;
          }

          setLoading(true);
          try {
            const { fromName, toName } = await swapBakeryInCourse(
              resolvedCourseId,
              context.congestedBakeryId,
              alternativeBakeryId,
            );
            appendBotMessage(
              `코스를 ${fromName} → ${toName}(으)로 변경했어요!\n변경된 순서로 안내해 드릴게요.`,
            );
            lastCongestionContextRef.current = null;
          } catch (error) {
            appendBotMessage(getErrorMessage(error));
          } finally {
            setLoading(false);
            setChangeBubble(null);
          }
          return;
        }

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

  const celebrationFlowActiveRef = useRef(false);
  const celebrationMessageSeenRef = useRef(false);

  const openChat = () => {
    trackCuratorOpened();
    setChangeBubble(null);
    setCelebrationBubble(null);
    setOpen(true);
  };

  const openCelebrationChat = () => {
    celebrationFlowActiveRef.current = true;
    openChat();
  };

  const sendMessage = (raw: string) => {
    const text = raw.trim();
    if (!text || loading) return;

    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: "user", text }]);
    setLoading(true);

    void (async () => {
      try {
        if (isCourseExplainIntent(text)) {
          if (!courseGuideActive || !courseId || courseId <= 0) {
            setMessages((prev) => [
              ...prev,
              {
                id: `course-not-active-${Date.now()}`,
                role: "bot",
                text: COURSE_NOT_IN_PROGRESS_MESSAGE,
              },
            ]);
            return;
          }

          const course = await getCourseDetail(courseId);
          setMessages((prev) => [
            ...prev,
            {
              id: `course-explain-${Date.now()}`,
              role: "bot",
              text: buildCourseExplainMessage(course),
              showCourseMap: true,
            },
          ]);
          return;
        }

        if (isCourseCancelIntent(text)) {
          if (!courseGuideActive) {
            setMessages((prev) => [
              ...prev,
              {
                id: `course-not-active-${Date.now()}`,
                role: "bot",
                text: COURSE_NOT_IN_PROGRESS_MESSAGE,
              },
            ]);
            return;
          }

          const resolvedCourseId = await resolveChatCourseId(courseId);
          try {
            const tour = await getCurrentTour();
            if (
              resolvedCourseId &&
              tour?.status === "IN_PROGRESS" &&
              tour.courseId === resolvedCourseId
            ) {
              await completeTour(resolvedCourseId);
            }
          } catch {
            /* 투어가 시작되지 않았거나 이미 종료된 경우 코스 안내 세션만 종료 */
          }

          endCourseGuide();
          setActiveTourCourseId(null);
          setCourseMovementBubble(null);
          setChangeBubble(null);
          setMessages((prev) => [
            ...prev,
            {
              id: `course-cancel-${Date.now()}`,
              role: "bot",
              text: "진행 중이던 코스를 취소했어요. 언제든 새 코스로 다시 시작해 보세요!",
            },
          ]);
          return;
        }

        if (isCourseReorderIntent(text)) {
          const resolvedCourseId = await resolveChatCourseId(courseId);
          if (!resolvedCourseId) {
            appendBotMessage(
              "코스 정보를 찾을 수 없어요. 루트에서 코스를 선택하거나 코스 안내를 시작한 뒤 다시 시도해 주세요.",
            );
            return;
          }

          const reorderMessage = await buildCourseReorderReply(
            resolvedCourseId,
            lastCongestionResultsRef,
            lastCongestionContextRef,
          );
          if (!reorderMessage) return;

          setMessages((prev) => [
            ...prev,
            {
              id: `course-reorder-${Date.now()}`,
              role: "bot",
              ...reorderMessage,
            },
          ]);

          if (reorderMessage.actions && reorderMessage.actions.length > 0) {
            setChangeBubble({
              text: reorderMessage.text,
              actions: reorderMessage.actions,
            });
          }
          return;
        }

        if (isNextBakeryRecommendIntent(text)) {
          const resolvedCourseId = await resolveChatCourseId(courseId);
          if (!resolvedCourseId) {
            appendBotMessage(
              "코스 정보를 찾을 수 없어요. 코스 안내를 시작한 뒤 다시 시도해 주세요.",
            );
            return;
          }

          const recommendMessage = await buildNextBakeryRecommendReply(
            resolvedCourseId,
            lastCongestionResultsRef,
            lastCongestionContextRef,
          );

          setMessages((prev) => [
            ...prev,
            {
              id: `next-bakery-${Date.now()}`,
              role: "bot",
              ...recommendMessage,
            },
          ]);

          if (recommendMessage.actions && recommendMessage.actions.length > 0) {
            setChangeBubble({
              text: recommendMessage.text,
              actions: recommendMessage.actions,
            });
          }
          return;
        }

        if (courseId && courseId > 0 && isCongestionCheckIntent(text)) {
          const course = await getCourseDetail(courseId);
          const bakeryIds = course.bakeries.map((bakery) => bakery.id).filter((id) => id > 0);
          if (bakeryIds.length === 0) {
            throw new Error("코스에 빵집 정보가 없어 혼잡도를 확인할 수 없습니다.");
          }

          const res = await checkTourCongestion({ courseId, bakeryIds });
          const results = res.data ?? [];
          lastCongestionResultsRef.current = results;
          const bakeryNamesById = buildBakeryNameLookup(course.bakeries);
          const congestionMessage = buildCongestionChatBotMessage(results, bakeryNamesById);

          if (!congestionMessage) {
            appendBotMessage("지금은 혼잡한 빵집이 없어요. 기존 코스대로 안내해 드릴게요!");
            return;
          }

          if (congestionMessage.congestionContext) {
            lastCongestionContextRef.current = congestionMessage.congestionContext;
          }

          setMessages((prev) => [
            ...prev,
            {
              id: `congestion-${Date.now()}`,
              role: "bot",
              ...congestionMessage,
            },
          ]);

          const primaryAlert = findPrimaryCongestionAlert(results);
          if (primaryAlert && courseGuideActive) {
            const alertName =
              bakeryNamesById.get(primaryAlert.bakeryId) ??
              primaryAlert.bakeryName?.trim() ??
              "방문 예정 빵집";
            applyCourseMovementBubble({
              title: `${alertName} 혼잡해요`,
              subtitle:
                primaryAlert.expectedWaitMin != null && primaryAlert.expectedWaitMin > 0
                  ? `예상 대기 약 ${primaryAlert.expectedWaitMin}분 · 코스를 확인해보세요`
                  : "예상 웨이팅을 확인해보세요",
              dismissKey: `congestion:${courseId}:${primaryAlert.bakeryId}:${primaryAlert.level ?? ""}`,
            });
          } else if (congestionMessage.actions && congestionMessage.actions.length > 0) {
            setChangeBubble({
              text: congestionMessage.text,
              actions: congestionMessage.actions,
            });
          }
          return;
        }

        if (!courseGuideActive) {
          setMessages((prev) => [
            ...prev,
            {
              id: `course-not-active-${Date.now()}`,
              role: "bot",
              text: COURSE_NOT_IN_PROGRESS_MESSAGE,
            },
          ]);
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
        appendBotMessage(getBreadBotErrorMessage(e));
      } finally {
        setLoading(false);
      }
    })();
  };

  const handleQuickReply = (label: string) => {
    trackCuratorGuideClicked(label);
    sendMessage(label);
  };

  const handleCourseDetail = () => {
    if (!effectiveTourCourseId) return;
    setOpen(false);
    saveRouteFocusCourseId(effectiveTourCourseId);
    void navigate({
      to: "/ai-search-result",
      search: { courseId: effectiveTourCourseId, from: "route" },
    });
  };

  const clearChatHistory = () => {
    setMessages([]);
    setConversationId(undefined);
    setLoading(false);
    try {
      localStorage.removeItem(CHAT_STORAGE_KEY);
    } catch {
      /* ignore */
    }
  };

  const handleBackToStart = () => {
    clearChatHistory();
  };

  const handleCelebrationMessageSeen = useCallback(() => {
    if (!celebrationFlowActiveRef.current) return;
    celebrationMessageSeenRef.current = true;
  }, []);

  const closeChat = () => {
    setCelebrationBubble(null);
    setOpen(false);
    if (
      pendingCelebrationCourseId != null &&
      celebrationFlowActiveRef.current &&
      celebrationMessageSeenRef.current
    ) {
      celebrationFlowActiveRef.current = false;
      celebrationMessageSeenRef.current = false;
      acknowledgeCelebration();
    }
  };

  const handleChangeAction = (button: ChatActionButton) => {
    setChangeBubble(null);
    trackCuratorOpened();
    setOpen(true);
    void handleButtonAction(button);
  };

  const handleTourStart = async () => {
    if (!tourBubble) return;
    const { courseId: tourCourseId, mode } = tourBubble;
    if (mode === "start" || mode === "autostart") {
      if (await hasConflictingActiveTour(tourCourseId)) {
        setActiveTourConflictOpen(true);
        return;
      }
    }
    setTourBubble(null);
    startCourseGuide(tourCourseId);
    if (mode === "start" || mode === "autostart") {
      trackTourStarted(tourCourseId);
      await startTour(tourCourseId).catch(() => undefined);
    }
    setActiveTourCourseId(tourCourseId);
    celebratedTourRef.current.delete(`celebrated:${tourCourseId}`);
    void navigate({ to: "/tour", search: { courseId: tourCourseId } });
  };

  const handleOpenTourPage = () => {
    const tourCourseId = activeTourCourseId;
    setOpen(false);
    if (tourCourseId && tourCourseId > 0) {
      void navigate({ to: "/tour", search: { courseId: tourCourseId } });
    }
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

  const dismissCourseMovementBubble = () => {
    if (courseMovementBubble) {
      dismissedMovementRef.current.add(courseMovementBubble.dismissKey);
    }
    setCourseMovementBubble(null);
  };

  const dismissArrivalBubble = () => {
    if (tourArrivalPrompt) {
      dismissedArrivalRef.current.add(tourArrivalPrompt.dismissKey);
      setArrivalRecheckNonce((value) => value + 1);
    }
  };

  /** GPS 도착 말풍선 — 사용자가 「완료처리」를 눌렀을 때만 방문 체크 API 호출 */
  const confirmArrivalVisitByUser = useCallback(
    async (prompt: TourArrivalPrompt) => {
      if (arrivalVisitInFlightRef.current || arrivalBusy) return;
      arrivalVisitInFlightRef.current = true;
      setArrivalBusy(true);
      try {
        trackBakeryVisitChecked(prompt.courseId, prompt.order);
        const updated = await checkTourVisit(prompt.courseId, prompt.order);
        dismissedArrivalRef.current.add(prompt.dismissKey);
        setArrivalRecheckNonce((value) => value + 1);
        if (updated.status === "COMPLETED") {
          startCelebrationPending(updated.courseId);
          endCourseGuide();
          notifyTourCompleteCelebration(updated.courseId);
        }
      } catch (error) {
        appendBotMessage(getErrorMessage(error));
      } finally {
        arrivalVisitInFlightRef.current = false;
        setArrivalBusy(false);
      }
    },
    [appendBotMessage, arrivalBusy, endCourseGuide, startCelebrationPending],
  );

  const showCelebrationBubble = celebrationBubble !== null && !open;
  const showTourArrivalBubble =
    tourArrivalPrompt !== null && showFloatingButton && !open && courseGuideActive;
  const showCourseMovementBubble =
    !showTourArrivalBubble &&
    courseMovementBubble !== null &&
    showFloatingButton &&
    !open &&
    !onTourPage &&
    courseGuideActive;
  const showTourBubble =
    tourBubble !== null && !open && !onTourPage && tourBubble.mode !== "resume";
  const showChangeBubble =
    !showTourArrivalBubble &&
    !showCourseMovementBubble &&
    tourBubble === null &&
    reserveNudgeBubble === null &&
    changeBubble !== null &&
    !open;
  const showReserveNudgeBubble =
    !showTourArrivalBubble &&
    tourBubble === null &&
    changeBubble === null &&
    reserveNudgeBubble !== null &&
    !open &&
    !onTourPage;

  return (
    <>
      <BreadBotConfetti active={showConfetti} onComplete={() => setShowConfetti(false)} />
      {open ? (
        <BreadBotChatModal
          listRef={listRef}
          messages={messages}
          loading={loading}
          courseId={courseId}
          courseMovementBubble={courseMovementBubble}
          courseGuideActive={courseGuideActive}
          activeTourCourseId={activeTourCourseId}
          onClose={closeChat}
          onQuickReply={handleQuickReply}
          onAction={(button) => void handleButtonAction(button)}
          onCourseDetail={handleCourseDetail}
          onBackToStart={handleBackToStart}
          onOpenTourPage={handleOpenTourPage}
          onCelebrationViewed={handleCelebrationMessageSeen}
        />
      ) : null}

      {showCelebrationBubble && celebrationBubble ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[73] mx-auto w-full max-w-[402px]">
          <div
            className={cn(
              "pointer-events-auto w-[min(280px,calc(100%-40px))] rounded-r4 bg-white p-x4 shadow-[0_8px_28px_rgba(0,0,0,0.2)]",
              inlineBubblePositionClass,
            )}
          >
            <button
              type="button"
              aria-label="축하 닫기"
              onClick={() => setCelebrationBubble(null)}
              className="absolute right-x2 top-x2 flex h-x6 w-x6 items-center justify-center rounded-full text-size-3 text-gray-400 hover:bg-gray-100"
            >
              ✕
            </button>

            <p className="whitespace-pre-wrap pr-x4 font-pretendard text-size-3 leading-t5 text-gray-1000">
              {`🎉 코스를 모두 완료했어요!\n축하 메시지가 도착했어요!`}
            </p>

            <div className="mt-x3 flex flex-col gap-x2">
              <button
                type="button"
                onClick={openCelebrationChat}
                className="h-[40px] w-full rounded-r2 bg-orange-600 font-pretendard text-size-3 font-bold text-gray-00"
              >
                축하 메시지 보기
              </button>
            </div>

            <div className="absolute -bottom-[7px] right-[28px] h-[14px] w-[14px] rotate-45 bg-white shadow-[3px_3px_6px_rgba(0,0,0,0.06)]" />
          </div>
        </div>
      ) : null}

      {showTourBubble && tourBubble ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[72] mx-auto w-full max-w-[402px]">
          <div
            className={cn(
              "pointer-events-auto w-[min(280px,calc(100%-40px))] rounded-r4 bg-white p-x4 shadow-[0_8px_28px_rgba(0,0,0,0.2)]",
              inlineBubblePositionClass,
            )}
          >
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
          <div
            className={cn(
              "pointer-events-auto w-[min(280px,calc(100%-40px))] rounded-r4 bg-white p-x4 shadow-[0_8px_28px_rgba(0,0,0,0.2)]",
              inlineBubblePositionClass,
            )}
          >
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
                onAction={(button) => void handleButtonAction(button, reserveNudgeBubble.courseId)}
              />
            </div>

            <div className="absolute -bottom-[7px] right-[28px] h-[14px] w-[14px] rotate-45 bg-white shadow-[3px_3px_6px_rgba(0,0,0,0.06)]" />
          </div>
        </div>
      ) : null}

      {showChangeBubble && changeBubble ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[72] mx-auto w-full max-w-[402px]">
          <div
            className={cn(
              "pointer-events-auto w-[min(280px,calc(100%-40px))] rounded-r4 bg-white p-x4 shadow-[0_8px_28px_rgba(0,0,0,0.2)]",
              inlineBubblePositionClass,
            )}
          >
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

      {showTourArrivalBubble && tourArrivalPrompt ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[73] mx-auto w-full max-w-[402px]">
          <ChatbotCourseSpeechBubble
            bubblePositionClass={bubblePositionClass}
            title={`곧 코스 ${tourArrivalPrompt.order}번 빵집에 도착할 것 같아요!`}
            subtitle="방문완료 처리 해드릴까요?"
            actions={[
              {
                label: arrivalBusy ? "처리 중…" : "완료처리",
                variant: "primary",
                disabled: arrivalBusy,
                onClick: () => void confirmArrivalVisitByUser(tourArrivalPrompt),
              },
              {
                label: "무시하기",
                variant: "secondary",
                disabled: arrivalBusy,
                onClick: dismissArrivalBubble,
              },
            ]}
          />
        </div>
      ) : null}

      {showCourseMovementBubble && courseMovementBubble ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[72] mx-auto w-full max-w-[402px]">
          <ChatbotCourseSpeechBubble
            bubblePositionClass={bubblePositionClass}
            title={courseMovementBubble.title}
            subtitle={courseMovementBubble.subtitle}
            onClose={dismissCourseMovementBubble}
            onClick={openChat}
          />
        </div>
      ) : null}

      {showFloatingButton ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[70] mx-auto w-full max-w-[402px]">
          <button
            type="button"
            aria-label={open ? "AI 큐레이터 닫기" : "AI 큐레이터 채팅 열기"}
            onClick={() => (open ? closeChat() : openChat())}
            className={cn(
              "pointer-events-auto block shrink-0 border-0 bg-transparent p-0",
              fabPositionClass,
            )}
            style={{ width: CHATBOT_FAB_SIZE, height: CHATBOT_FAB_SIZE }}
          >
            <img
              src={ChatBotImage}
              alt=""
              aria-hidden
              className="h-full w-full object-contain"
              draggable={false}
            />
          </button>
        </div>
      ) : null}

      <ActiveTourConflictDialog
        open={activeTourConflictOpen}
        onConfirm={() => setActiveTourConflictOpen(false)}
      />
    </>
  );
}
