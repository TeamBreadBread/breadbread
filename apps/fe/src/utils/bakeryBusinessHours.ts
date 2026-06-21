import type { BakeryDetail } from "@/api/types/bakery";

const SEOUL_TZ = "Asia/Seoul";

const JS_DAY_TO_KEY = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
] as const;

const WEEKLY_ROWS: { key: (typeof JS_DAY_TO_KEY)[number]; label: string }[] = [
  { key: "MONDAY", label: "월요일" },
  { key: "TUESDAY", label: "화요일" },
  { key: "WEDNESDAY", label: "수요일" },
  { key: "THURSDAY", label: "목요일" },
  { key: "FRIDAY", label: "금요일" },
  { key: "SATURDAY", label: "토요일" },
  { key: "SUNDAY", label: "일요일" },
];

export type BakeryHoursSource = Pick<
  BakeryDetail,
  | "openTime"
  | "closeTime"
  | "weekdayOpen"
  | "weekdayClose"
  | "weekendOpen"
  | "weekendClose"
  | "closedDays"
>;

export type WeeklyHoursRow = {
  label: string;
  text: string;
  isToday: boolean;
};

function getSeoulNow(): Date {
  return new Date(new Date().toLocaleString("en-US", { timeZone: SEOUL_TZ }));
}

export function formatClock(value: string | null | undefined): string | null {
  if (value == null || value === "") return null;
  const m = String(value).match(/(\d{1,2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]}` : null;
}

function parseMinutes(value: string | null | undefined): number | null {
  const clock = formatClock(value);
  if (!clock) return null;
  const [h, m] = clock.split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
}

function minutesToLabel(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}:${String(m).padStart(2, "0")}`;
}

function isWeekendJsDay(jsDay: number): boolean {
  return jsDay === 0 || jsDay === 6;
}

export function isBakeryClosedOnJsDay(jsDay: number, closedDays?: string[] | null): boolean {
  if (!closedDays?.length) return false;
  const key = JS_DAY_TO_KEY[jsDay];
  return closedDays.includes(key);
}

/** 서울 기준 오늘 요일이 정기 휴무인지 확인합니다. */
export function isBakeryClosedToday(closedDays?: string[] | null): boolean {
  const todayJs = getSeoulNow().getDay();
  return isBakeryClosedOnJsDay(todayJs, closedDays);
}

function isClosedDay(jsDay: number, closedDays?: string[] | null): boolean {
  return isBakeryClosedOnJsDay(jsDay, closedDays);
}

function getOpenCloseForJsDay(
  jsDay: number,
  detail: BakeryHoursSource,
): { open: number; close: number } | null {
  const weekend = isWeekendJsDay(jsDay);
  const openStr = weekend
    ? (detail.weekendOpen ?? detail.openTime)
    : (detail.weekdayOpen ?? detail.openTime);
  const closeStr = weekend
    ? (detail.weekendClose ?? detail.closeTime)
    : (detail.weekdayClose ?? detail.closeTime);
  const open = parseMinutes(openStr);
  const close = parseMinutes(closeStr);
  if (open == null || close == null) return null;
  return { open, close };
}

function isWithinHours(nowMinutes: number, open: number, close: number): boolean {
  if (open === close) return false;
  if (close > open) {
    return nowMinutes >= open && nowMinutes <= close;
  }
  return nowMinutes >= open || nowMinutes <= close;
}

/** 목록 API의 오늘 openTime·closeTime 기준 영업 중 여부 */
export function isListItemOpenNow(item: {
  openTime?: string | null;
  closeTime?: string | null;
}): boolean {
  const open = parseMinutes(item.openTime);
  const close = parseMinutes(item.closeTime);
  if (open == null || close == null) return false;
  const now = getSeoulNow();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  return isWithinHours(nowMinutes, open, close);
}

function findNextOpenJsDay(
  fromJsDay: number,
  detail: BakeryHoursSource,
): { jsDay: number; open: number } | null {
  for (let offset = 1; offset <= 7; offset += 1) {
    const jsDay = (fromJsDay + offset) % 7;
    if (isClosedDay(jsDay, detail.closedDays)) continue;
    const hours = getOpenCloseForJsDay(jsDay, detail);
    if (hours) return { jsDay, open: hours.open };
  }
  return null;
}

export function getBakeryHoursStatusLabel(detail: BakeryHoursSource): string {
  const now = getSeoulNow();
  const todayJs = now.getDay();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  if (isClosedDay(todayJs, detail.closedDays)) {
    const next = findNextOpenJsDay(todayJs, detail);
    if (!next) return "영업 시간 정보 없음";
    return `${formatOpenDayPrefix(todayJs, next.jsDay)} ${minutesToLabel(next.open)} 오픈`;
  }

  const todayHours = getOpenCloseForJsDay(todayJs, detail);
  if (!todayHours) return "영업 시간 정보 없음";

  if (isWithinHours(nowMinutes, todayHours.open, todayHours.close)) {
    return "영업 중";
  }

  const next = findNextOpenJsDay(todayJs, detail);
  if (!next) return "영업 시간 정보 없음";
  return `${formatOpenDayPrefix(todayJs, next.jsDay)} ${minutesToLabel(next.open)} 오픈`;
}

function formatOpenDayPrefix(fromJsDay: number, targetJsDay: number): string {
  const offset = (targetJsDay - fromJsDay + 7) % 7;
  if (offset === 1) return "내일";
  const row = WEEKLY_ROWS.find((r) => JS_DAY_TO_KEY.indexOf(r.key) === targetJsDay);
  return row?.label ?? "다음 영업일";
}

export function buildWeeklyHoursRows(detail: BakeryHoursSource): WeeklyHoursRow[] {
  const todayJs = getSeoulNow().getDay();
  return WEEKLY_ROWS.map(({ key, label }) => {
    const jsDay = JS_DAY_TO_KEY.indexOf(key);
    const isToday = jsDay === todayJs;
    if (isClosedDay(jsDay, detail.closedDays)) {
      return { label, text: "휴무", isToday };
    }
    const hours = getOpenCloseForJsDay(jsDay, detail);
    if (!hours) {
      return { label, text: "영업시간 미정", isToday };
    }
    return {
      label,
      text: `${minutesToLabel(hours.open)} - ${minutesToLabel(hours.close)}`,
      isToday,
    };
  });
}
