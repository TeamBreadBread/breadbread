import type { BakeryForAI } from "@/api/types/bakery";
import { fetchTrendBakeries } from "@/services/trends";
import type { TrendBakery, TrendBread, TrendStatus } from "@/types/trend";

export function formatTrendStatusLabel(status: TrendStatus | string | null | undefined): string {
  switch (status) {
    case "RISING":
      return "급상승";
    case "STABLE":
      return "유지";
    case "FALLING":
      return "하락";
    default:
      return "";
  }
}

export function formatGrowthRate(value: number | null | undefined): string | null {
  if (value == null || !Number.isFinite(value)) return null;
  const rounded = Math.round(value * 10) / 10;
  const prefix = rounded > 0 ? "+" : "";
  return `${prefix}${rounded}%`;
}

export function formatTrendScore(value: number | null | undefined): string | null {
  if (value == null || !Number.isFinite(value)) return null;
  return Math.round(value).toLocaleString("ko-KR");
}

export function formatTrendGrowthCaption(
  status: TrendStatus | string | null | undefined,
  growthRate: number | null | undefined,
): string | null {
  const growth = formatGrowthRate(growthRate);
  switch (status) {
    case "RISING":
      return growth ? `상승 중 ${growth}` : "상승 중";
    case "FALLING":
      return growth ? `하락 ${growth}` : "하락";
    case "STABLE":
      return growth ?? "유지";
    default:
      return growth;
  }
}

const BREAD_EMOJI_RULES: { pattern: RegExp; emoji: string }[] = [
  { pattern: /케이크|cake/i, emoji: "🎂" },
  { pattern: /크로와상|크루아상|croissant/i, emoji: "🥐" },
  { pattern: /소금빵|salt bread/i, emoji: "🥖" },
  { pattern: /바게트|baguette/i, emoji: "🥖" },
  { pattern: /베이글|bagel/i, emoji: "🥯" },
  { pattern: /도넛|donut|doughnut/i, emoji: "🍩" },
  { pattern: /쿠키|cookie/i, emoji: "🍪" },
  { pattern: /마카롱|macaron/i, emoji: "🧁" },
  { pattern: /붕어빵|잉어빵/i, emoji: "🐟" },
  { pattern: /타르트|tart/i, emoji: "🥧" },
  { pattern: /스콘|scone/i, emoji: "🥮" },
  { pattern: /와플|waffle/i, emoji: "🧇" },
  { pattern: /프레첼|pretzel/i, emoji: "🥨" },
  { pattern: /샌드위치|sandwich/i, emoji: "🥪" },
  { pattern: /피자|pizza/i, emoji: "🍕" },
  { pattern: /식빵|toast bread/i, emoji: "🍞" },
  { pattern: /단팥|팥빵|호빵/i, emoji: "🫘" },
  { pattern: /빵/, emoji: "🍞" },
];

/** SNS 트렌드 빵 키워드에 맞는 이모티콘 */
export function getTrendBreadEmoji(keyword: string | null | undefined): string {
  const normalized = keyword?.trim() ?? "";
  if (!normalized) return "🍞";

  for (const rule of BREAD_EMOJI_RULES) {
    if (rule.pattern.test(normalized)) {
      return rule.emoji;
    }
  }

  return "🍞";
}

export type TrendBreadMedalRank = 1 | 2 | 3;

const TREND_BREAD_MEDAL_EMOJI: Record<TrendBreadMedalRank, string> = {
  1: "🥇",
  2: "🥈",
  3: "🥉",
};

export function getTrendBreadMedalEmoji(rank: TrendBreadMedalRank): string {
  return TREND_BREAD_MEDAL_EMOJI[rank];
}

/** trendScore 상위 3개 키워드에 금·은·동메달 순위 부여 */
export function buildTrendBreadMedalRankMap(
  breads: Pick<TrendBread, "keyword" | "trendScore">[],
): Map<string, TrendBreadMedalRank> {
  const ranked = [...breads]
    .filter((bread) => bread.trendScore != null && Number.isFinite(bread.trendScore))
    .sort((a, b) => (b.trendScore ?? 0) - (a.trendScore ?? 0))
    .slice(0, 3);

  const map = new Map<string, TrendBreadMedalRank>();
  ranked.forEach((bread, index) => {
    map.set(bread.keyword, (index + 1) as TrendBreadMedalRank);
  });
  return map;
}

export function buildTrendCurationTitle(
  keyword: string | null | undefined,
  bakeryCount: number,
): string {
  const trimmedKeyword = keyword?.trim() ?? "";
  const count = Number.isFinite(bakeryCount) && bakeryCount > 0 ? Math.floor(bakeryCount) : 0;
  if (!trimmedKeyword) {
    return `요즘 핫한 대전 맛집 ${count}곳`;
  }
  return `요즘 핫한 대전 "${trimmedKeyword}" 맛집 ${count}곳`;
}

export function buildTrendBreadListTitle(keyword: string | null | undefined): string {
  const trimmedKeyword = keyword?.trim() ?? "";
  if (!trimmedKeyword) {
    return "빵집 리스트";
  }
  return `'${trimmedKeyword}' 빵집`;
}

/** 트렌드 순위 상위 N개 키워드 중 매칭 빵집이 있는 것을 무작위로 선택 */
export function pickRandomTopTrendKeyword(
  keywordChips: TrendBread[],
  aiBakeries: BakeryForAI[],
  maxRank = 5,
  randomSeed = Math.random(),
): string {
  const pool = keywordChips
    .slice(0, Math.max(1, maxRank))
    .map((chip) => chip.keyword?.trim())
    .filter((keyword): keyword is string => Boolean(keyword));

  if (pool.length === 0) return "";

  const shuffled = shuffleWithSeed(pool, randomSeed);

  for (const keyword of shuffled) {
    if (matchBakeriesByBreadKeyword(aiBakeries, keyword).length > 0) {
      return keyword;
    }
  }

  return shuffled[0];
}

function shuffleWithSeed<T>(items: T[], seed: number): T[] {
  const result = [...items];
  let state = Math.floor(Math.abs(seed) * 2 ** 31) || 1;

  for (let i = result.length - 1; i > 0; i--) {
    state = (state * 1664525 + 1013904223) >>> 0;
    const j = state % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

export function findMostPopularBreadKeyword(aiBakeries: BakeryForAI[]): string | null {
  const scores = new Map<string, number>();

  for (const bakery of aiBakeries) {
    for (const bread of bakery.breads ?? []) {
      const name = bread.name?.trim();
      if (!name) continue;
      const weight = bread.signature ? 2 : 1;
      scores.set(name, (scores.get(name) ?? 0) + weight);
    }
  }

  let bestName: string | null = null;
  let bestScore = 0;
  for (const [name, score] of scores) {
    if (score > bestScore) {
      bestScore = score;
      bestName = name;
    }
  }

  return bestName;
}

function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

export function bakeryServesBreadKeyword(bakery: BakeryForAI, keyword: string): boolean {
  const normalizedKeyword = normalizeText(keyword);
  if (!normalizedKeyword) return false;
  return (bakery.breads ?? []).some((bread) =>
    normalizeText(bread.name).includes(normalizedKeyword),
  );
}

export function mapAiBakeryToTrendBakery(bakery: BakeryForAI, keyword: string): TrendBakery {
  const matchedMenus =
    bakery.breads
      ?.filter((bread) => normalizeText(bread.name).includes(normalizeText(keyword)))
      .map((bread) => bread.name.trim())
      .filter(Boolean) ?? [];

  return {
    bakeryId: bakery.id,
    bakeryName: bakery.name,
    keyword,
    trendScore: null,
    trendStatus: null,
    growthRate: null,
    matchedMenus,
    sources: null,
    collectedAt: "",
  };
}

export function matchBakeriesByBreadKeyword(
  aiBakeries: BakeryForAI[],
  keyword: string,
): TrendBakery[] {
  return aiBakeries
    .filter((bakery) => bakeryServesBreadKeyword(bakery, keyword))
    .sort((left, right) => (right.rating ?? 0) - (left.rating ?? 0))
    .map((bakery) => mapAiBakeryToTrendBakery(bakery, keyword));
}

export function hasTrendBakeryId(
  bakery: TrendBakery,
): bakery is TrendBakery & { bakeryId: number } {
  return typeof bakery.bakeryId === "number" && bakery.bakeryId > 0;
}

/** 키워드에 맞는 빵집 ID 목록 — 트렌드 API 우선, 없으면 메뉴 DB 매칭 */
export async function resolveBakeryIdsForKeyword(
  keyword: string,
  aiBakeries: BakeryForAI[],
): Promise<number[]> {
  const trimmed = keyword.trim();
  if (!trimmed) return [];

  let trendBakeries: TrendBakery[] = [];
  try {
    const trend = await fetchTrendBakeries({ keyword: trimmed, page: 0, size: 50 });
    trendBakeries = trend.bakeries.filter(hasTrendBakeryId);
  } catch {
    // 트렌드 API 실패 시 메뉴 매칭만 사용
  }

  const menuMatched = matchBakeriesByBreadKeyword(aiBakeries, trimmed);
  const merged = new Map<number, TrendBakery>();

  for (const bakery of trendBakeries) {
    if (hasTrendBakeryId(bakery)) {
      merged.set(bakery.bakeryId, bakery);
    }
  }
  for (const bakery of menuMatched) {
    if (hasTrendBakeryId(bakery) && !merged.has(bakery.bakeryId)) {
      merged.set(bakery.bakeryId, bakery);
    }
  }

  return [...merged.keys()];
}

/** 키워드에 맞는 대표 빵집 ID — 트렌드 API 우선, 없으면 메뉴 DB 매칭 */
export async function resolvePrimaryBakeryIdForKeyword(
  keyword: string,
  aiBakeries: BakeryForAI[],
): Promise<number | null> {
  const ids = await resolveBakeryIdsForKeyword(keyword, aiBakeries);
  return ids[0] ?? null;
}
