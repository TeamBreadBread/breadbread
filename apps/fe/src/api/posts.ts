import { apiClient, extractData } from "@/api/client";
import type { ApiEnvelope } from "@/api/types/common";

const PATH = "/posts";

export type PostType = "NOTICE" | "FREE" | "ARTICLE";

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
};

export type CreatePostRequest = {
  title: string;
  content: string;
  postType: PostType;
  imageUrls?: string[];
};

export type CommentItem = {
  id: number;
  nickname: string;
  profileImageUrl: string | null;
  content: string;
  createdAt: string;
  author: boolean;
};

export type CommentListResponse = {
  comments: CommentItem[];
  total: number;
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
  likeCount: number;
  author: boolean;
  commentListResponse: CommentListResponse;
};

export type UpdatePostRequest = {
  title?: string;
  content?: string;
  imageUrls?: string[] | null;
};

/** Jackson/Lombok 조합에서 `isAuthor` 필드가 `author`로 내려오는 경우를 함께 처리 */
type AuthorFlag = { author?: boolean; isAuthor?: boolean };

type ApiCommentRaw = Omit<CommentItem, "author"> & AuthorFlag;

type ApiPostDetailRaw = Omit<PostDetail, "author" | "commentListResponse"> &
  AuthorFlag & {
    commentListResponse: { comments: ApiCommentRaw[]; total: number };
  };

function pickAuthor(payload: AuthorFlag): boolean {
  return Boolean(payload.author ?? payload.isAuthor);
}

function normalizeComment(c: ApiCommentRaw): CommentItem {
  return { ...c, author: pickAuthor(c) };
}

function normalizePostDetail(raw: ApiPostDetailRaw): PostDetail {
  return {
    ...raw,
    author: pickAuthor(raw),
    commentListResponse: {
      ...raw.commentListResponse,
      comments: raw.commentListResponse.comments.map(normalizeComment),
    },
  };
}

function buildPostsQueryString(params?: GetPostsParams): string {
  const search = new URLSearchParams();
  if (params?.postTypes?.length) {
    for (const t of params.postTypes) {
      search.append("postTypes", t);
    }
  }
  if (params?.keyword != null && params.keyword.trim() !== "") {
    search.set("keyword", params.keyword.trim());
  }
  if (params?.page !== undefined) {
    search.set("page", String(params.page));
  }
  if (params?.size !== undefined) {
    search.set("size", String(params.size));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export async function getPosts(params?: GetPostsParams): Promise<PostListResponse> {
  const url = `${PATH}${buildPostsQueryString(params)}`;
  const { data } = await apiClient.get<ApiEnvelope<PostListResponse>>(url);
  return extractData(data);
}

export async function createPost(body: CreatePostRequest): Promise<number> {
  const { data } = await apiClient.post<ApiEnvelope<number>>(PATH, body);
  return extractData(data);
}

export async function getPost(id: number): Promise<PostDetail> {
  const { data } = await apiClient.get<ApiEnvelope<ApiPostDetailRaw>>(`${PATH}/${id}`);
  return normalizePostDetail(extractData(data));
}

export async function updatePost(id: number, body: UpdatePostRequest): Promise<void> {
  const { data } = await apiClient.patch<ApiEnvelope<Record<string, never>>>(`${PATH}/${id}`, body);
  extractData(data);
}

export async function deletePost(id: number): Promise<void> {
  const { data } = await apiClient.delete<ApiEnvelope<Record<string, never>>>(`${PATH}/${id}`);
  extractData(data);
}

export async function likePost(id: number): Promise<void> {
  const { data } = await apiClient.post<ApiEnvelope<Record<string, never>>>(`${PATH}/${id}/likes`);
  extractData(data);
}

export async function unlikePost(id: number): Promise<void> {
  const { data } = await apiClient.delete<ApiEnvelope<Record<string, never>>>(
    `${PATH}/${id}/likes`,
  );
  extractData(data);
}

export async function createComment(postId: number, content: string): Promise<CommentItem> {
  const { data } = await apiClient.post<ApiEnvelope<ApiCommentRaw>>(`${PATH}/${postId}/comments`, {
    content,
  });
  return normalizeComment(extractData(data));
}

export async function updateComment(
  postId: number,
  commentId: number,
  content: string,
): Promise<void> {
  const { data } = await apiClient.patch<ApiEnvelope<Record<string, never>>>(
    `${PATH}/${postId}/comments/${commentId}`,
    { content },
  );
  extractData(data);
}

export async function deleteComment(postId: number, commentId: number): Promise<void> {
  const { data } = await apiClient.delete<ApiEnvelope<Record<string, never>>>(
    `${PATH}/${postId}/comments/${commentId}`,
  );
  extractData(data);
}
