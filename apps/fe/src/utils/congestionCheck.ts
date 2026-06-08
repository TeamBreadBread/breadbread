import type { CongestionCheckResult } from "@/api/tours";
import type { BakeryCongestion } from "@/api/bakery";

const LEVEL_LABELS: Record<string, string> = {
  LOW: "여유",
  MEDIUM: "보통",
  HIGH: "혼잡",
};

const LEVEL_BADGE_CLASS: Record<string, string> = {
  LOW: "bg-emerald-50 text-emerald-700",
  MEDIUM: "bg-amber-50 text-amber-700",
  HIGH: "bg-red-50 text-red-700",
};

export function formatCongestionLevel(level?: string | null): string {
  if (!level?.trim()) return "정보 없음";
  const key = level.trim().toUpperCase();
  return LEVEL_LABELS[key] ?? level;
}

export function getCongestionBadgeClass(level?: string | null): string {
  const key = level?.trim().toUpperCase() ?? "";
  return LEVEL_BADGE_CLASS[key] ?? "bg-gray-100 text-gray-600";
}

export function formatBakeryCongestionSummary(
  item: BakeryCongestion | CongestionCheckResult,
): string {
  const parts = [formatCongestionLevel(item.level)];
  if (item.expectedWaitMin != null && item.expectedWaitMin > 0) {
    parts.push(`대기 약 ${item.expectedWaitMin}분`);
  }
  return parts.join(" · ");
}

export function mapCongestionByBakeryId(items: BakeryCongestion[]): Map<number, BakeryCongestion> {
  return new Map(items.map((item) => [item.bakeryId, item]));
}

export function isCongestionCheckIntent(message: string): boolean {
  const text = message.trim();
  if (!text) return false;
  return /혼잡|대기|웨이팅|붐비|crowded|busy|congestion/i.test(text);
}

export type BakeryNameLookup = ReadonlyMap<number, string> | Readonly<Record<number, string>>;

export function buildBakeryNameLookup(
  bakeries: ReadonlyArray<{ id: number; name?: string | null }>,
): Map<number, string> {
  const map = new Map<number, string>();
  for (const bakery of bakeries) {
    const name = bakery.name?.trim();
    if (bakery.id > 0 && name) {
      map.set(bakery.id, name);
    }
  }
  return map;
}

function lookupBakeryName(
  bakeryId: number,
  apiName: string | null | undefined,
  names?: BakeryNameLookup,
): string {
  const fromApi = apiName?.trim();
  if (fromApi && fromApi.toLowerCase() !== "null") return fromApi;

  if (names) {
    const fromCourse =
      names instanceof Map
        ? names.get(bakeryId)
        : (names as Readonly<Record<number, string>>)[bakeryId];
    if (fromCourse?.trim()) return fromCourse.trim();
  }

  return bakeryId > 0 ? `빵집 #${bakeryId}` : "방문 예정인 빵집";
}

export function formatCongestionCheckResults(
  results: CongestionCheckResult[],
  bakeryNamesById?: BakeryNameLookup,
): string {
  if (results.length === 0) {
    return "혼잡도 분석 결과가 없습니다.";
  }

  return results
    .map((item) => {
      const bakeryName = lookupBakeryName(item.bakeryId, item.bakeryName, bakeryNamesById);
      const lines = [`📍 ${bakeryName}`, `· 혼잡도: ${formatCongestionLevel(item.level)}`];

      if (item.congestionScore != null && Number.isFinite(item.congestionScore)) {
        lines[1] += ` (점수 ${Math.round(item.congestionScore)})`;
      }
      if (item.expectedWaitMin != null && item.expectedWaitMin > 0) {
        lines.push(`· 예상 대기: 약 ${item.expectedWaitMin}분`);
      }
      if (item.reason?.trim()) {
        lines.push(`· ${item.reason.trim()}`);
      }
      return lines.join("\n");
    })
    .join("\n\n");
}

const HIGH_LEVELS = new Set(["HIGH", "CRITICAL"]);
const LONG_WAIT_MINUTES = 20;

export function isHighCongestionLevel(level?: string | null): boolean {
  const key = level?.trim().toUpperCase() ?? "";
  return HIGH_LEVELS.has(key);
}

export function isCongestionAlertResult(item: CongestionCheckResult): boolean {
  if (isHighCongestionLevel(item.level)) return true;
  return (item.expectedWaitMin ?? 0) >= LONG_WAIT_MINUTES;
}

export function findPrimaryCongestionAlert(
  results: CongestionCheckResult[],
): CongestionCheckResult | null {
  const sorted = [...results].sort((a, b) => (b.congestionScore ?? 0) - (a.congestionScore ?? 0));
  return sorted.find(isCongestionAlertResult) ?? null;
}

export function buildCongestionAlertMessage(
  primary: CongestionCheckResult,
  bakeryNamesById?: BakeryNameLookup,
): string {
  const bakeryName = lookupBakeryName(primary.bakeryId, primary.bakeryName, bakeryNamesById);
  const waitText =
    primary.expectedWaitMin != null && primary.expectedWaitMin > 0
      ? ` 웨이팅이 약 ${primary.expectedWaitMin}분 예상돼요.`
      : " 웨이팅이 길어질 수 있어요.";
  return `😥 현재 방문 예정인 ${bakeryName}이(가) 혼잡해요.${waitText}\n코스를 변경해드릴까요?`;
}

export function findAlternativeBakerySuggestion(
  results: CongestionCheckResult[],
  primaryAlert: CongestionCheckResult,
  bakeryNamesById?: BakeryNameLookup,
): { bakeryId: number; bakeryName: string } | null {
  const candidates = [...results]
    .filter((item) => item.bakeryId !== primaryAlert.bakeryId)
    .sort((a, b) => {
      const aBusy = isCongestionAlertResult(a) ? 1 : 0;
      const bBusy = isCongestionAlertResult(b) ? 1 : 0;
      if (aBusy !== bBusy) return aBusy - bBusy;
      return (a.congestionScore ?? 0) - (b.congestionScore ?? 0);
    });

  const picked = candidates[0];
  if (!picked) return null;

  return {
    bakeryId: picked.bakeryId,
    bakeryName: lookupBakeryName(picked.bakeryId, picked.bakeryName, bakeryNamesById),
  };
}

export function buildCongestionChatMessage(
  primaryAlert: CongestionCheckResult,
  alternative: { bakeryName: string },
  bakeryNamesById?: BakeryNameLookup,
): string {
  const congestedName = lookupBakeryName(
    primaryAlert.bakeryId,
    primaryAlert.bakeryName,
    bakeryNamesById,
  );

  return [
    `지금 ${congestedName} 웨이팅이 너무 길어서 빵을 먹기 어려울 것 같아요 ㅠㅠ`,
    "",
    "대신 고객님 취향에 맞는 다른 빵집을 찾아봤어요 !",
    `${alternative.bakeryName}으로 변경해드릴까요?`,
  ].join("\n");
}

export function buildCongestionCheckReply(
  response: {
    success: boolean;
    data: CongestionCheckResult[];
    error?: string | null;
  },
  options?: { bakeryNamesById?: BakeryNameLookup },
): { text: string; isCongestionAlert: boolean; primaryAlert: CongestionCheckResult | null } {
  const bakeryNamesById = options?.bakeryNamesById;

  if (!response.success) {
    return {
      text: response.error?.trim() || "혼잡도 분석에 실패했습니다. 잠시 후 다시 시도해 주세요.",
      isCongestionAlert: false,
      primaryAlert: null,
    };
  }

  const primaryAlert = findPrimaryCongestionAlert(response.data);
  if (primaryAlert) {
    return {
      text: buildCongestionAlertMessage(primaryAlert, bakeryNamesById),
      isCongestionAlert: true,
      primaryAlert,
    };
  }

  return {
    text: `현재 혼잡도를 분석했어요.\n\n${formatCongestionCheckResults(response.data, bakeryNamesById)}`,
    isCongestionAlert: false,
    primaryAlert: null,
  };
}
