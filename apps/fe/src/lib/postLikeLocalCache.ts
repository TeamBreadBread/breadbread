import type { PostDetail, PostSummary } from "@/api/posts";

const LS_KEY = "breadbread_community_post_like_overlay_v1";
const CHANGE_EVENT = "breadbread-post-like-overlay-change";

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

export type PostSummaryWithLikeOverlay = PostSummary & { liked: boolean };

export function getPostLikeOverlay(postId: number): OverlayEntry | null {
  const e = readMap()[String(postId)];
  if (!e || typeof e.liked !== "boolean" || typeof e.likeCount !== "number") return null;
  return e;
}

export function setPostLikeOverlay(postId: number, entry: OverlayEntry, notify = true): void {
  const m = readMap();
  m[String(postId)] = entry;
  writeMap(m);
  if (notify && typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
  }
}

/** 목록 API 응답과 오버레이 숫자를 맞춤(서버 카운트가 더 크면 반영) */
export function reconcileOverlaysWithSummaries(posts: PostSummary[], notify = true): void {
  let changed = false;
  const m = readMap();
  for (const p of posts) {
    const o = m[String(p.id)];
    if (!o) continue;
    const nextCount = Math.max(o.likeCount, p.likeCount);
    if (nextCount !== o.likeCount) {
      m[String(p.id)] = { liked: o.liked, likeCount: nextCount };
      changed = true;
    }
  }
  if (changed) writeMap(m);
  if (changed && notify && typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
  }
}

export function mergePostSummaryWithLikeOverlay(post: PostSummary): PostSummaryWithLikeOverlay {
  const o = getPostLikeOverlay(post.id);
  if (!o) return { ...post, liked: false };
  return {
    ...post,
    liked: o.liked,
    likeCount: Math.max(post.likeCount, o.likeCount),
  };
}

export function applyOverlayToPostDetail(detail: PostDetail): PostDetail {
  const o = getPostLikeOverlay(detail.id);
  if (!o) return detail;
  return {
    ...detail,
    liked: o.liked,
    likeCount: Math.max(detail.likeCount, o.likeCount),
  };
}

export function persistDetailToLikeOverlay(detail: PostDetail): void {
  setPostLikeOverlay(detail.id, { liked: detail.liked, likeCount: detail.likeCount }, true);
}

export function subscribePostLikeOverlayChange(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => cb();
  window.addEventListener(CHANGE_EVENT, handler);
  return () => window.removeEventListener(CHANGE_EVENT, handler);
}
