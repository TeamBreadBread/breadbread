import { apiClient, extractData } from "@/api/client";
import type { ApiEnvelope } from "@/api/types/common";
import type {
  SubmitNewBakeryReportRequest,
  SubmitUpdateBakeryReportRequest,
} from "@/utils/bakeryReport";
import type {
  BakeryDetail,
  BakeryForAI,
  BakeryListResponse,
  BakeryReviewListResponse,
  BakeryReviewWritePayload,
  BakerySummaryListResponse,
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
  BakerySummaryItem,
  BakerySummaryListResponse,
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
  if (params.dong !== undefined && params.dong !== "") {
    q.set("dong", params.dong);
  }
  if (params.userLat !== undefined) {
    q.set("userLat", String(params.userLat));
  }
  if (params.userLng !== undefined) {
    q.set("userLng", String(params.userLng));
  }
  if (params.radiusMeters !== undefined) {
    q.set("radiusMeters", String(params.radiusMeters));
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

/**
 * Swagger `GET /bakeries/summary` — id·이름·주소·별점·썸네일만 반환.
 * 필터·정렬은 목록 조회(`getBakeries`)와 동일하게 지원.
 */
export async function getBakeriesSummary(
  params: GetBakeriesParams = {},
  signal?: AbortSignal,
): Promise<BakerySummaryListResponse> {
  const { data } = await apiClient.get<ApiEnvelope<BakerySummaryListResponse>>(
    `${PATH}/summary${buildSearchQuery(params)}`,
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

export type BakeryCongestionSignals = {
  waitingKeywordCount?: number | null;
  openRunKeywordCount?: number | null;
  soldOutKeywordCount?: number | null;
  recentMentionCount?: number | null;
  morningMentions?: number | null;
  afternoonMentions?: number | null;
  eveningMentions?: number | null;
};

/** `GET /bakeries/{id}/congestion` · `GET /bakeries/congestion` 공통 응답 */
export type BakeryCongestion = {
  bakeryId: number;
  bakeryName: string;
  level?: string | null;
  congestionScore?: number | null;
  expectedWaitMin?: number | null;
  reason?: string | null;
  signals?: BakeryCongestionSignals | null;
  updatedAt?: string | null;
};

/** Swagger `GET /bakeries/{id}/congestion` */
export async function getBakeryCongestion(bakeryId: number): Promise<BakeryCongestion> {
  const { data } = await apiClient.get<ApiEnvelope<BakeryCongestion>>(
    `${PATH}/${bakeryId}/congestion`,
  );
  return extractData(data);
}

/** Swagger `GET /bakeries/congestion?ids=1,2,3` — congestionScore 오름차순 */
export async function getBakeriesCongestion(bakeryIds: number[]): Promise<BakeryCongestion[]> {
  const ids = bakeryIds.filter((id) => id > 0);
  if (ids.length === 0) return [];

  const { data } = await apiClient.get<ApiEnvelope<BakeryCongestion[]>>(`${PATH}/congestion`, {
    params: { ids: ids.join(",") },
  });
  return extractData(data) ?? [];
}

/** `POST /bakeries/reports/new` — 새 빵집 등록 제보 */
export async function submitNewBakeryReport(body: SubmitNewBakeryReportRequest): Promise<number> {
  const { data } = await apiClient.post<ApiEnvelope<number>>(`${PATH}/reports/new`, body);
  return extractData(data);
}

/** `POST /bakeries/reports/update` — 기존 빵집 정보 수정 제보 */
export async function submitUpdateBakeryReport(
  body: SubmitUpdateBakeryReportRequest,
): Promise<number> {
  const { data } = await apiClient.post<ApiEnvelope<number>>(`${PATH}/reports/update`, body);
  return extractData(data);
}

export type SubmitMenuReportRequest = {
  bakeryId: number;
  menuName: string;
  description?: string;
};

/** `POST /bakeries/reports/menu` — 등록된 빵집 메뉴 건의 */
export async function submitMenuBakeryReport(body: SubmitMenuReportRequest): Promise<number> {
  const { data } = await apiClient.post<ApiEnvelope<number>>(`${PATH}/reports/menu`, body);
  return extractData(data);
}
