export type BakeryListEntryFrom = "home" | "bbangteo" | "bbangteo-home" | "ai-result";

export function parseBakeryListEntryFrom(value: unknown): BakeryListEntryFrom | undefined {
  if (
    value === "home" ||
    value === "bbangteo" ||
    value === "bbangteo-home" ||
    value === "ai-result"
  ) {
    return value;
  }
  return undefined;
}

function dedupePositiveInts(nums: readonly number[]): number[] | undefined {
  const seen = new Set<number>();
  const out: number[] = [];
  for (const n of nums) {
    if (!Number.isFinite(n) || n <= 0) continue;
    const k = Math.floor(n);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(k);
    if (out.length >= 12) break;
  }
  return out.length > 0 ? out : undefined;
}

export type BbangteoBakeryListSearch = {
  from?: BakeryListEntryFrom;
  curationOnly?: boolean;
  dong?: string;
  curationPins?: number[];
  excludePins?: number[];
  /** SNS 트렌드 빵 키워드 — 해당 빵을 파는 빵집만 표시 */
  breadKeyword?: string;
};

/** `/bbangteo-bakery-list` 이동 시 검색 파라미터 기본값 채우기 */
export function buildBbangteoBakeryListSearch(search: BbangteoBakeryListSearch = {}) {
  const breadKeyword = search.breadKeyword?.trim();
  return {
    from: search.from,
    curationOnly: search.curationOnly ?? false,
    dong: search.dong,
    curationPins: search.curationPins ?? [],
    excludePins: search.excludePins ?? [],
    breadKeyword: breadKeyword || undefined,
  };
}

type BakeryDetailBackTarget = {
  to: "/bbangteo" | "/bbangteo-bakery-list" | "/ai-search-result";
  search?: Record<string, unknown>;
};

/** 빵집 상세에서 뒤로가기 시 이동할 경로 */
export function getBakeryDetailBackTarget(
  listEntryFrom?: BakeryListEntryFrom,
  returnCourseId?: number,
  trendBreadKeyword?: string,
): BakeryDetailBackTarget {
  if (listEntryFrom === "ai-result") {
    return {
      to: "/ai-search-result",
      search: { courseId: returnCourseId ?? null },
    };
  }
  const trimmedBread = trendBreadKeyword?.trim();
  if (listEntryFrom === "bbangteo-home" && trimmedBread) {
    return {
      to: "/bbangteo-bakery-list",
      search: buildBbangteoBakeryListSearch({
        from: "bbangteo-home",
        curationOnly: true,
        breadKeyword: trimmedBread,
      }),
    };
  }
  if (listEntryFrom === "bbangteo-home") {
    return { to: "/bbangteo" };
  }
  return {
    to: "/bbangteo-bakery-list",
    search: buildBbangteoBakeryListSearch({ from: listEntryFrom }),
  };
}

export function parseBreadKeywordParam(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export type BbakeryDetailSearch = {
  bakeryId?: number;
  from?: BakeryListEntryFrom;
  courseId?: number;
  reviewUploaded?: boolean;
  reviewTab?: boolean;
  trendBread?: string;
};

/** `/bbangteo-bakery-detail` 이동 시 검색 파라미터 기본값 채우기 */
export function buildBbakeryDetailSearch(search: BbakeryDetailSearch = {}) {
  const trendBread = search.trendBread?.trim();
  return {
    bakeryId: search.bakeryId,
    from: search.from,
    courseId: search.courseId,
    reviewUploaded: search.reviewUploaded,
    reviewTab: search.reviewTab,
    trendBread: trendBread || undefined,
  };
}

export function parseCurationOnlyParam(value: unknown): boolean {
  return value === true || value === "true" || value === 1 || value === "1";
}

export function parseDongFilterParam(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/** URL/검색 파라미터에서 큐레이션 고정 순서 id 목록 파싱 */
export function parseCurationPinsParam(value: unknown): number[] | undefined {
  if (value == null || value === "") return undefined;

  if (typeof value === "string") {
    const parts = value.split(",").flatMap((s) => {
      const n = Number.parseInt(s.trim(), 10);
      return Number.isFinite(n) && n > 0 ? [n] : [];
    });
    return dedupePositiveInts(parts);
  }

  if (Array.isArray(value)) {
    const nums = value.flatMap((v) => {
      if (typeof v === "number") return Number.isFinite(v) && v > 0 ? [v] : [];
      if (typeof v === "string") {
        const n = Number.parseInt(v.trim(), 10);
        return Number.isFinite(n) && n > 0 ? [n] : [];
      }
      return [];
    });
    return dedupePositiveInts(nums);
  }

  return undefined;
}
