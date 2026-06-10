import type { BakeryForAI } from "@/api/types/bakery";
import type { TrendBakery, TrendStatus } from "@/types/trend";

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
