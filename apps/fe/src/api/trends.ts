import { apiClient, extractData } from "@/api/client";
import type { ApiEnvelope } from "@/api/types/common";

const PATH = "/trends";

export type TrendStatus = "RISING" | "STABLE" | "FALLING";

/** Swagger `GET /trends/breads` 응답 항목 */
export type TrendBread = {
  keyword: string;
  trendScore: number | null;
  trendStatus: TrendStatus | string | null;
  growthRate: number | null;
  sources: string[] | null;
  collectedAt: string;
};

export type TrendBreadListResponse = {
  breads: TrendBread[];
  total: number;
  page: number;
  size: number;
  hasNext: boolean;
};

/** Swagger `GET /trends/bakeries` 응답 항목 */
export type TrendBakery = {
  bakeryId: number | null;
  bakeryName: string | null;
  keyword: string;
  trendScore: number | null;
  trendStatus: TrendStatus | string | null;
  growthRate: number | null;
  matchedMenus: string[] | null;
  sources: string[] | null;
  collectedAt: string;
};

export type TrendBakeryListResponse = {
  bakeries: TrendBakery[];
  total: number;
  page: number;
  size: number;
  hasNext: boolean;
};

export type GetTrendBreadsParams = {
  status?: TrendStatus;
  page?: number;
  size?: number;
};

export type GetTrendBakeriesParams = {
  keyword?: string;
  page?: number;
  size?: number;
};

/** `GET /trends/breads` — 유행 빵 키워드 목록 (trendScore 내림차순) */
export async function getTrendBreads(
  params: GetTrendBreadsParams = {},
): Promise<TrendBreadListResponse> {
  const { data } = await apiClient.get<ApiEnvelope<TrendBreadListResponse>>(`${PATH}/breads`, {
    params: {
      status: params.status,
      page: params.page ?? 0,
      size: params.size ?? 20,
    },
  });
  return extractData(data);
}

/** `GET /trends/bakeries` — 트렌드 키워드 매칭 빵집 목록 (trendScore 내림차순) */
export async function getTrendBakeries(
  params: GetTrendBakeriesParams = {},
): Promise<TrendBakeryListResponse> {
  const { data } = await apiClient.get<ApiEnvelope<TrendBakeryListResponse>>(`${PATH}/bakeries`, {
    params: {
      keyword: params.keyword?.trim() || undefined,
      page: params.page ?? 0,
      size: params.size ?? 20,
    },
  });
  return extractData(data);
}
