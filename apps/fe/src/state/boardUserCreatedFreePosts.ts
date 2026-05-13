import type { BbangteoBoardListRow } from "@/data/bbangteoBoardMock";
import type { PostType } from "@/api/posts";

const STORAGE_KEY = "breadbread_user_free_posts_v1";

const MAX_ROWS = 40;

let snapshotRows: BbangteoBoardListRow[] = [];
let revision = 0;
const listeners = new Set<() => void>();

function emit() {
  revision += 1;
  for (const l of listeners) {
    l();
  }
}

function readFromStorage(): BbangteoBoardListRow[] {
  if (typeof sessionStorage === "undefined") {
    return [];
  }
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw?.trim()) {
      return [];
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    const out: BbangteoBoardListRow[] = [];
    for (const row of parsed) {
      if (
        row &&
        typeof row === "object" &&
        typeof (row as BbangteoBoardListRow).id === "number" &&
        typeof (row as BbangteoBoardListRow).title === "string"
      ) {
        const r = row as BbangteoBoardListRow & { postType?: PostType };
        out.push({
          ...r,
          postType: r.postType ?? "FREE",
        });
      }
    }
    return out.slice(0, MAX_ROWS);
  } catch {
    return [];
  }
}

function writeToStorage(rows: BbangteoBoardListRow[]) {
  if (typeof sessionStorage === "undefined") {
    return;
  }
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
  } catch {
    /* ignore quota */
  }
}

function bootstrap() {
  snapshotRows = readFromStorage();
}

bootstrap();

/** 새로 작성했거나 수정한 실제 글 요약을 mock 목록 레이어에 반영(id 기준 교체 후 맨 위) */
export function upsertUserCreatedFreePost(row: BbangteoBoardListRow) {
  const next = [row, ...snapshotRows.filter((r) => r.id !== row.id)].slice(0, MAX_ROWS);
  snapshotRows = next;
  writeToStorage(next);
  emit();
}

export function prependUserCreatedFreePost(row: BbangteoBoardListRow) {
  upsertUserCreatedFreePost(row);
}

export function removeUserCreatedFreePost(postId: number) {
  const next = snapshotRows.filter((r) => r.id !== postId);
  if (next.length === snapshotRows.length) {
    return;
  }
  snapshotRows = next;
  writeToStorage(next);
  emit();
}

export function getUserCreatedFreePostsSnapshot(): readonly BbangteoBoardListRow[] {
  return snapshotRows;
}

export function getUserCreatedFreePostsRevision(): number {
  return revision;
}

export function subscribeUserCreatedFreePosts(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
