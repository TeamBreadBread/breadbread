import { apiClient, extractData } from "@/api/client";
import type { ApiEnvelope } from "@/api/types/common";
import type {
  BakeryDetail,
  BakeryForAI,
  BakeryListResponse,
  BakeryReviewListResponse,
  BakeryReviewWritePayload,
  GetBakeriesParams,
  GetBakeryReviewsParams,
  UpdateBakeryReviewPayload,
} from "@/api/types/bakery";

export type {
  BakeryDetail,
  BakeryDetailBread,
  BakeryForAI,
  BakeryAiBreadItem,
  BakeryListItem,
  BakeryListResponse,
  BakerySortType,
  GetBakeriesParams,
  BakeryReview,
  BakeryReviewListResponse,
  GetBakeryReviewsParams,
  BakeryReviewWritePayload,
  UpdateBakeryReviewPayload,
} from "@/api/types/bakery";

/** 공개 목록/상세는 `/bakeries` — `/api/bakeries` 는 게이트웨이에서 401 처리됨 */
const PATH = "/bakeries";

/** Swagger `GET /bakeries/{bakeryId}/reviews` 기본 `size` */
export const BAKERY_REVIEWS_DEFAULT_SIZE = 10;

/** Swagger `CreateBakeryRequest` 등 — 필요 시 세부 타입 분리 가능 */
export type CreateBakeryPayload = Record<string, unknown>;
export type UpdateBakeryPayload = Record<string, unknown>;
export type CreateBakeryBreadPayload = Record<string, unknown>;
export type UpdateBakeryBreadPayload = Record<string, unknown>;

function buildSearchQuery(params: GetBakeriesParams): string {
  const q = new URLSearchParams();
  if (params.keyword !== undefined && params.keyword !== "") {
    q.set("keyword", params.keyword);
  }
  if (params.sort !== undefined) {
    q.set("sort", params.sort);
  }
  q.set("open", String(params.open ?? false));
  if (params.region !== undefined && params.region !== "") {
    q.set("region", params.region);
  }
  q.set("page", String(params.page ?? 0));
  q.set("size", String(params.size ?? 10));
  const s = q.toString();
  return s ? `?${s}` : "";
}

export async function getBakeries(
  params: GetBakeriesParams = {},
  signal?: AbortSignal,
): Promise<BakeryListResponse> {
  const { data } = await apiClient.get<ApiEnvelope<BakeryListResponse>>(
    `${PATH}${buildSearchQuery(params)}`,
    { signal },
  );
  return extractData(data);
}

export async function getBakeryById(id: number): Promise<BakeryDetail> {
  const { data } = await apiClient.get<ApiEnvelope<BakeryDetail>>(`${PATH}/${id}`);
  return extractData(data);
}

/** Swagger `POST /bakeries/{id}/likes` — 이미 좋아요 시 409 */
export async function likeBakery(bakeryId: number): Promise<void> {
  const { data } = await apiClient.post<ApiEnvelope<void>>(`${PATH}/${bakeryId}/likes`);
  extractData(data);
}

/** Swagger `DELETE /bakeries/{id}/likes` — 좋아요 없음 시 400 */
export async function unlikeBakery(bakeryId: number): Promise<void> {
  const { data } = await apiClient.delete<ApiEnvelope<void>>(`${PATH}/${bakeryId}/likes`);
  extractData(data);
}

export async function getBakeriesForAI(): Promise<BakeryForAI[]> {
  const { data } = await apiClient.get<ApiEnvelope<BakeryForAI[]>>(`${PATH}/ai`);
  return extractData(data);
}

export async function createBakery(payload: CreateBakeryPayload): Promise<number> {
  const { data } = await apiClient.post<ApiEnvelope<number>>(PATH, payload);
  return extractData(data);
}

export async function updateBakery(id: number, payload: UpdateBakeryPayload): Promise<void> {
  const { data } = await apiClient.put<ApiEnvelope<void>>(`${PATH}/${id}`, payload);
  extractData(data);
}

export async function deleteBakery(id: number): Promise<void> {
  const { data } = await apiClient.delete<ApiEnvelope<void>>(`${PATH}/${id}`);
  extractData(data);
}

export async function createBakeryBread(
  bakeryId: number,
  payload: CreateBakeryBreadPayload,
): Promise<number> {
  const { data } = await apiClient.post<ApiEnvelope<number>>(`${PATH}/${bakeryId}/breads`, payload);
  return extractData(data);
}

export async function updateBakeryBread(
  bakeryId: number,
  breadId: number,
  payload: UpdateBakeryBreadPayload,
): Promise<void> {
  const { data } = await apiClient.put<ApiEnvelope<void>>(
    `${PATH}/${bakeryId}/breads/${breadId}`,
    payload,
  );
  extractData(data);
}

export async function deleteBakeryBread(bakeryId: number, breadId: number): Promise<void> {
  const { data } = await apiClient.delete<ApiEnvelope<void>>(
    `${PATH}/${bakeryId}/breads/${breadId}`,
  );
  extractData(data);
}

function buildReviewsQuery(params: GetBakeryReviewsParams = {}): string {
  const q = new URLSearchParams();
  q.set("sort", params.sort ?? "LATEST");
  q.set("page", String(params.page ?? 0));
  q.set("size", String(params.size ?? BAKERY_REVIEWS_DEFAULT_SIZE));
  const s = q.toString();
  return s ? `?${s}` : "";
}

/** Swagger `GET /bakeries/{bakeryId}/reviews` — `sort`·`page`·`size` 쿼리 */
export async function getBakeryReviews(
  bakeryId: number,
  params?: GetBakeryReviewsParams,
): Promise<BakeryReviewListResponse> {
  const { data } = await apiClient.get<ApiEnvelope<BakeryReviewListResponse>>(
    `${PATH}/${bakeryId}/reviews${buildReviewsQuery(params)}`,
  );
  return extractData(data);
}

/** Swagger `POST /bakeries/{bakeryId}/reviews` — 응답 201, `data`는 생성된 리뷰 id */
export async function createBakeryReview(
  bakeryId: number,
  payload: BakeryReviewWritePayload,
): Promise<number> {
  const { data } = await apiClient.post<ApiEnvelope<number>>(
    `${PATH}/${bakeryId}/reviews`,
    payload,
  );
  return extractData(data);
}

export async function updateBakeryReview(
  bakeryId: number,
  reviewId: number,
  payload: UpdateBakeryReviewPayload,
): Promise<void> {
  const { data } = await apiClient.patch<ApiEnvelope<void>>(
    `${PATH}/${bakeryId}/reviews/${reviewId}`,
    payload,
  );
  extractData(data);
}

export async function deleteBakeryReview(bakeryId: number, reviewId: number): Promise<void> {
  const { data } = await apiClient.delete<ApiEnvelope<void>>(
    `${PATH}/${bakeryId}/reviews/${reviewId}`,
  );
  extractData(data);
}
