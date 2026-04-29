import { apiClient, extractData } from "@/api/client";
import type { ApiEnvelope } from "@/api/types/common";
import type {
  BakeryDetail,
  BakeryForAI,
  BakeryListResponse,
  GetBakeriesParams,
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
} from "@/api/types/bakery";

const PATH = "/api/bakeries";

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

export async function getBakeries(params: GetBakeriesParams = {}): Promise<BakeryListResponse> {
  const { data } = await apiClient.get<ApiEnvelope<BakeryListResponse>>(
    `${PATH}${buildSearchQuery(params)}`,
  );
  return extractData(data);
}

export async function getBakeryById(id: number): Promise<BakeryDetail> {
  const { data } = await apiClient.get<ApiEnvelope<BakeryDetail>>(`${PATH}/${id}`);
  return extractData(data);
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
