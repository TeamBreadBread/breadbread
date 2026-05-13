import { apiClient, extractData } from "@/api/client";
import type { ApiEnvelope } from "@/api/types/common";

const PATH = "/posts";

/** `ApiResponse<Void>` 등 `success: true` 만 있거나 본문이 비어 있어도 성공으로 처리 */
function throwIfEnvelopeFailed(data: unknown): void {
  if (data == null || typeof data !== "object") {
    return;
  }
  const env = data as ApiEnvelope<unknown>;
  if (env.success === false) {
    extractData(env as ApiEnvelope<never>);
  }
}

export type PostType = "FREE" | "NOTICE" | "ARTICLE";

/** 게시글 목록 정렬 — 백엔드 `sort` 쿼리와 동일 */
export type PostListSort = "LATEST" | "LIKE_COUNT";

export type PostSummary = {
  id: number;
  title: string;
  postType: PostType;
  likeCount: number;
  commentCount: number;
  thumbnailImageUrl: string | null;
  createdAt: string;
};

export type PostListResponse = {
  posts: PostSummary[];
  total: number;
  page: number;
  size: number;
  hasNext: boolean;
};

export type GetPostsParams = {
  postTypes?: PostType[];
  keyword?: string;
  page?: number;
  size?: number;
  sort?: PostListSort;
};

function buildPostsQuery(params: GetPostsParams): string {
  const q = new URLSearchParams();
  for (const t of params.postTypes ?? []) {
    q.append("postTypes", t);
  }
  if (params.keyword !== undefined && params.keyword.trim() !== "") {
    q.set("keyword", params.keyword.trim());
  }
  q.set("page", String(params.page ?? 0));
  q.set("size", String(params.size ?? 10));
  q.set("sort", params.sort ?? "LATEST");
  return q.toString();
}

export async function getPosts(params: GetPostsParams = {}): Promise<PostListResponse> {
  const qs = buildPostsQuery(params);
  const { data } = await apiClient.get<ApiEnvelope<PostListResponse>>(`${PATH}?${qs}`);
  return extractData(data);
}

export type CreatePostBody = {
  title: string;
  content: string;
  postType: PostType;
  imageUrls: string[];
};

export async function createPost(body: CreatePostBody): Promise<number> {
  const { data } = await apiClient.post<ApiEnvelope<number>>(PATH, body);
  return extractData(data);
}

export type UpdatePostBody = {
  title?: string;
  content?: string;
  imageUrls?: string[];
};

export async function updatePost(postId: number, body: UpdatePostBody): Promise<void> {
  const { data } = await apiClient.patch<ApiEnvelope<Record<string, never>>>(
    `${PATH}/${postId}`,
    body,
  );
  throwIfEnvelopeFailed(data);
}

export async function deletePost(postId: number): Promise<void> {
  const { data } = await apiClient.delete<ApiEnvelope<Record<string, never>>>(`${PATH}/${postId}`);
  throwIfEnvelopeFailed(data);
}

export type CommentResponse = {
  id: number;
  nickname: string;
  profileImageUrl: string | null;
  content: string;
  createdAt: string;
  /** Swagger 예시 키 */
  author?: boolean;
  /** Jackson 기본 직렬화 시 */
  isAuthor?: boolean;
};

export type PostDetail = {
  id: number;
  title: string;
  nickname: string;
  profileImageUrl: string | null;
  createdAt: string;
  content: string;
  imageUrls: string[];
  liked: boolean;
  author?: boolean;
  isAuthor?: boolean;
  likeCount: number;
  commentListResponse: {
    comments: CommentResponse[];
    total: number;
  };
};

type PostDetailRaw = PostDetail & { isLiked?: boolean };

function coalesceLiked(raw: PostDetailRaw): boolean {
  const candidates = [raw.liked, raw.isLiked] as unknown[];
  for (const v of candidates) {
    if (v === true || v === 1) return true;
    if (v === false || v === 0) return false;
    if (typeof v === "string") {
      const s = v.toLowerCase();
      if (s === "true" || s === "1") return true;
      if (s === "false" || s === "0") return false;
    }
  }
  return false;
}

function normalizePostDetail(raw: PostDetailRaw): PostDetail {
  const comments = raw.commentListResponse?.comments ?? [];
  let total = raw.commentListResponse?.total ?? 0;
  if (!Number.isFinite(total)) total = 0;
  if (comments.length > 0 && total === 0) {
    total = comments.length;
  }
  return {
    ...raw,
    liked: coalesceLiked(raw),
    commentListResponse: { comments, total },
  };
}

export async function getPost(postId: number): Promise<PostDetail> {
  const { data } = await apiClient.get<ApiEnvelope<PostDetailRaw>>(`${PATH}/${postId}`);
  return normalizePostDetail(extractData(data));
}

export async function likePost(postId: number): Promise<void> {
  /** 빈 본문 + application/json 조합은 일부 환경에서 400을 유발해 `{}` 전송 */
  const { data } = await apiClient.post<ApiEnvelope<Record<string, never>>>(
    `${PATH}/${postId}/likes`,
    {},
  );
  throwIfEnvelopeFailed(data);
}

export async function unlikePost(postId: number): Promise<void> {
  const { data } = await apiClient.delete<ApiEnvelope<Record<string, never>>>(
    `${PATH}/${postId}/likes`,
  );
  throwIfEnvelopeFailed(data);
}

export type CreateCommentBody = {
  content: string;
};

export async function createComment(
  postId: number,
  body: CreateCommentBody,
): Promise<CommentResponse> {
  const { data } = await apiClient.post<ApiEnvelope<CommentResponse>>(
    `${PATH}/${postId}/comments`,
    body,
  );
  return extractData(data);
}

export type UpdateCommentBody = {
  content: string;
};

export async function updateComment(
  postId: number,
  commentId: number,
  body: UpdateCommentBody,
): Promise<void> {
  const { data } = await apiClient.patch<ApiEnvelope<Record<string, never>>>(
    `${PATH}/${postId}/comments/${commentId}`,
    body,
  );
  throwIfEnvelopeFailed(data);
}

export async function deleteComment(postId: number, commentId: number): Promise<void> {
  const { data } = await apiClient.delete<ApiEnvelope<Record<string, never>>>(
    `${PATH}/${postId}/comments/${commentId}`,
  );
  throwIfEnvelopeFailed(data);
}

export function isPostAuthor(detail: PostDetail): boolean {
  return Boolean(detail.author ?? detail.isAuthor);
}

export function isCommentAuthor(c: CommentResponse): boolean {
  return Boolean(c.author ?? c.isAuthor);
}
