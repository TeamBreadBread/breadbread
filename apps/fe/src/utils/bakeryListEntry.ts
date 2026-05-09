export type BakeryListEntryFrom = "home" | "bbangteo" | "ai-result";

export function parseBakeryListEntryFrom(value: unknown): BakeryListEntryFrom | undefined {
  if (value === "home" || value === "bbangteo" || value === "ai-result") {
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
