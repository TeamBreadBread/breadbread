import type { ReservationSummary } from "@/api/reservation";

/** 예약 출발 시간 도달 후 안내/자동 시작을 유지할 시간 */
export const TOUR_REMINDER_WINDOW_MS = 3 * 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;
const MORNING_REMINDER_HOUR = 8;

/** 단계별 알림 중복 방지 (localStorage) */
export const TOUR_REMINDER_FIRED_KEY = "bbang_tour_reminders_fired";

export type TourReminderStage = "morning" | "one_hour" | "ten_min" | "autostart";

export function reservationStartMs(date: string, time: string): number | null {
  if (!date) return null;
  const hhmm = (time || "00:00").slice(0, 5);
  const ms = new Date(`${date}T${hhmm}:00`).getTime();
  return Number.isNaN(ms) ? null : ms;
}

export function formatHhmm(time: string): string {
  return (time || "").slice(0, 5);
}

export function isSameLocalDay(a: number, b: number): boolean {
  const d1 = new Date(a);
  const d2 = new Date(b);
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function localDateKey(ms: number): string {
  const d = new Date(ms);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function buildReminderKey(
  stage: TourReminderStage,
  reservationId: number,
  reservationStartMs: number,
): string {
  const dateKey = localDateKey(reservationStartMs);
  return `${stage}:${dateKey}:${reservationId}`;
}

function readFiredReminderKeys(): string[] {
  try {
    const raw = localStorage.getItem(TOUR_REMINDER_FIRED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export function hasFiredReminder(key: string): boolean {
  return readFiredReminderKeys().includes(key);
}

export function markFiredReminder(key: string): void {
  try {
    const list = readFiredReminderKeys();
    if (!list.includes(key)) {
      list.push(key);
      localStorage.setItem(TOUR_REMINDER_FIRED_KEY, JSON.stringify(list));
    }
  } catch {
    // 저장 실패 시 무시 (중복 알림이 한 번 더 뜰 수 있음)
  }
}

export function isReminderEligibleReservation(status: ReservationSummary["status"]): boolean {
  return status === "CONFIRMED" || status === "PENDING";
}

export type TourReminderStageResult = {
  stage: TourReminderStage;
  key: string;
  buildText: (courseName: string, departureTime: string) => string;
};

/** 출발 전 단계별 알림 (10분 전 > 1시간 전 > 당일 오전 8시) */
export function resolvePreDepartureReminderStage(
  reservation: ReservationSummary,
  startMs: number,
  nowMs: number,
): TourReminderStageResult | null {
  const minutesUntil = (startMs - nowMs) / MINUTE_MS;

  if (minutesUntil <= 10) {
    return {
      stage: "ten_min",
      key: buildReminderKey("ten_min", reservation.id, startMs),
      buildText: (name) =>
        `'${name || "코스"}' 출발 10분 전이에요! ⏰\n예약 시간이 되면 빵 투어가 자동으로 시작돼요.`,
    };
  }

  if (minutesUntil <= 60) {
    return {
      stage: "one_hour",
      key: buildReminderKey("one_hour", reservation.id, startMs),
      buildText: (name) => `'${name || "코스"}' 출발 1시간 전이에요! 🚕\n슬슬 준비해 주세요.`,
    };
  }

  if (new Date(nowMs).getHours() >= MORNING_REMINDER_HOUR) {
    return {
      stage: "morning",
      key: buildReminderKey("morning", reservation.id, startMs),
      buildText: (name, departureTime) =>
        `오늘 '${name || "코스"}' 빵 투어가 있어요! 🍞\n출발 시간: ${formatHhmm(departureTime)}`,
    };
  }

  return null;
}
