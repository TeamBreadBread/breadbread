import { apiClient, extractData } from "@/api/client";
import type { ApiEnvelope } from "@/api/types/common";
import type {
  GetTrendBakeriesParams,
  GetTrendBreadsParams,
  GetTrendingBreadsParams,
  TrendBakeryListResponse,
  TrendBreadListResponse,
  TrendingBreadsResponse,
} from "@/types/trend";

const PATH = "/trends";

/** `GET /trends/breads` — trendScore 내림차순 인기 빵 키워드 */
export async function fetchTrendBreads(
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

/** `GET /trends/breads` — SNS/검색 인기 빵 키워드 (기본 page=0, size=10) */
export async function getTrendingBreads(
  params: GetTrendingBreadsParams = {},
): Promise<TrendingBreadsResponse> {
  return fetchTrendBreads({
    ...params,
    page: params.page ?? 0,
    size: params.size ?? 10,
  });
}

/** `GET /trends/bakeries` — 키워드 매칭 빵집 (trendScore 내림차순) */
export async function fetchTrendBakeries(
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
