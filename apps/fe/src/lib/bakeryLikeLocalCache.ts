import type { BakeryDetail, BakeryListItem } from "@/api/types/bakery";

const LS_KEY = "breadbread_bakery_like_overlay_v1";
const CHANGE_EVENT = "breadbread-bakery-like-overlay-change";

type OverlayEntry = { liked: boolean; likeCount: number };

function readMap(): Record<string, OverlayEntry> {
  if (typeof localStorage === "undefined") return {};
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return {};
    const o = JSON.parse(raw) as unknown;
    if (!o || typeof o !== "object") return {};
    return o as Record<string, OverlayEntry>;
  } catch {
    return {};
  }
}

function writeMap(m: Record<string, OverlayEntry>) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(m));
  } catch {
    /* quota 등 */
  }
}

export function getBakeryLikeOverlay(bakeryId: number): OverlayEntry | null {
  const e = readMap()[String(bakeryId)];
  if (!e || typeof e.liked !== "boolean" || typeof e.likeCount !== "number") return null;
  return e;
}

export function setBakeryLikeOverlay(bakeryId: number, entry: OverlayEntry, notify = true): void {
  const m = readMap();
  m[String(bakeryId)] = entry;
  writeMap(m);
  if (notify && typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
  }
}

export function mergeBakeryListItemWithLikeOverlay(item: BakeryListItem): BakeryListItem {
  const o = getBakeryLikeOverlay(item.id);
  if (!o) return item;
  return {
    ...item,
    liked: o.liked,
    likeCount: Math.max(item.likeCount ?? 0, o.likeCount),
  };
}

export function applyOverlayToBakeryDetail(detail: BakeryDetail): BakeryDetail {
  const o = getBakeryLikeOverlay(detail.id);
  if (!o) return detail;
  return {
    ...detail,
    liked: o.liked,
    likeCount: Math.max(detail.likeCount ?? 0, o.likeCount),
  };
}

export function persistBakeryDetailToLikeOverlay(detail: BakeryDetail): void {
  setBakeryLikeOverlay(
    detail.id,
    {
      liked: Boolean(detail.liked),
      likeCount: detail.likeCount != null ? Number(detail.likeCount) : 0,
    },
    true,
  );
}

export function subscribeBakeryLikeOverlayChange(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => cb();
  window.addEventListener(CHANGE_EVENT, handler);
  return () => window.removeEventListener(CHANGE_EVENT, handler);
}
