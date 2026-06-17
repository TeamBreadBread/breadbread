/** 빵집 별점 — 미등록·null이면 0 */
export function resolveBakeryRating(rating?: number | null): number {
  if (rating == null || !Number.isFinite(Number(rating))) return 0;
  return Number(rating);
}

/** 목록·상세 공통 표시 형식 (소수 첫째 자리) */
export function formatBakeryRating(rating: number): string {
  return resolveBakeryRating(rating).toFixed(1);
}

/** 후기 수 — 미등록·null이면 0 */
export function resolveBakeryReviewCount(reviewCount?: number | null): number {
  if (reviewCount == null || !Number.isFinite(Number(reviewCount))) return 0;
  return Math.max(0, Math.floor(Number(reviewCount)));
}

/** 후기가 1개 이상일 때만 평점 노출 (`reviewCount` 미제공 시 기존처럼 표시) */
export function shouldShowBakeryRating(reviewCount?: number | null): boolean {
  if (reviewCount == null) return true;
  return resolveBakeryReviewCount(reviewCount) > 0;
}
