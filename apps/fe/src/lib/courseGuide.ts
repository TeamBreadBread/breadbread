/** 코스 안내(빵텔리전트) 플로팅 버튼을 숨기는 경로 — 자유게시판·후기 작성·후기 목록 등 */
const BOT_FLOATING_HIDDEN_EXACT = new Set([
  "/bbangteo-board",
  "/bbangteo-board-write",
  "/bbangteo-bakery-review-write",
  "/my-reviews",
]);

const BOT_FLOATING_HIDDEN_PREFIXES = ["/bbangteo-bakery-detail"];

export function isBotFloatingHiddenPath(pathname: string): boolean {
  if (BOT_FLOATING_HIDDEN_EXACT.has(pathname)) return true;
  return BOT_FLOATING_HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}
