import type { PostDetail } from "@/api/posts";

/** 목록·상세에서 사용자가 변경한 좋아요 상태 (서버 재조회 시 해당 id 초기화) */
export type BoardPostEngagement = {
  liked: boolean;
  likeCount: number;
};

let snapshot = new Map<number, BoardPostEngagement>();
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) {
    l();
  }
}

export function setBoardPostEngagement(postId: number, engagement: BoardPostEngagement) {
  const next = new Map(snapshot);
  next.set(postId, engagement);
  snapshot = next;
  emit();
}

export function getBoardPostEngagement(postId: number): BoardPostEngagement | undefined {
  return snapshot.get(postId);
}

/** 상세 다시 들어왔을 때 로컬에서 눌렀던 좋아요를 복원 */
export function mergeBoardPostEngagementIntoDetail(postId: number, detail: PostDetail): PostDetail {
  const p = getBoardPostEngagement(postId);
  if (!p) {
    return detail;
  }
  return { ...detail, liked: p.liked, likeCount: p.likeCount };
}

export function clearBoardPostLikeOverridesForPostIds(postIds: number[]) {
  const next = new Map(snapshot);
  let changed = false;
  for (const id of postIds) {
    if (next.delete(id)) {
      changed = true;
    }
  }
  if (!changed) {
    return;
  }
  snapshot = next;
  emit();
}

export function subscribeBoardPostLikeOverrides(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getBoardPostLikeOverridesSnapshot(): ReadonlyMap<number, BoardPostEngagement> {
  return snapshot;
}
