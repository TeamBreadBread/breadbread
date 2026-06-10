/** 트렌드 상태 — Swagger `TrendStatus` */
export type TrendStatus = "RISING" | "STABLE" | "FALLING";

/** `GET /trends/breads` 항목 */
export type TrendBread = {
  keyword: string;
  trendScore: number | null;
  trendStatus: TrendStatus | string | null;
  growthRate: number | null;
  sources: string[] | null;
  collectedAt: string;
};

/** @alias TrendBread — SNS/검색 기반 인기 빵 키워드 */
export type TrendingBread = TrendBread;

export type TrendBreadListResponse = {
  breads: TrendBread[];
  total: number;
  page: number;
  size: number;
  hasNext: boolean;
};

/** @alias TrendBreadListResponse */
export type TrendingBreadsResponse = TrendBreadListResponse;

export type GetTrendBreadsParams = {
  status?: TrendStatus;
  page?: number;
  size?: number;
};

/** @alias GetTrendBreadsParams */
export type GetTrendingBreadsParams = GetTrendBreadsParams;

/** `GET /trends/bakeries` 항목 */
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

export type GetTrendBakeriesParams = {
  keyword?: string;
  page?: number;
  size?: number;
};

/** 큐레이션 데이터 출처 */
export type TrendCurationSource = "trend-api" | "menu-fallback";

export type TrendMenuFallbackData = {
  keyword: string;
  bakeries: TrendBakery[];
};
