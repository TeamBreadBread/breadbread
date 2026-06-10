/** @deprecated import from `@/services/trends` or `@/types/trend` */
export type {
  TrendStatus,
  TrendBread,
  TrendingBread,
  TrendBreadListResponse,
  TrendingBreadsResponse,
  TrendBakery,
  TrendBakeryListResponse,
  GetTrendBreadsParams,
  GetTrendingBreadsParams,
  GetTrendBakeriesParams,
} from "@/types/trend";

export {
  fetchTrendBreads as getTrendBreads,
  getTrendingBreads,
  fetchTrendBakeries as getTrendBakeries,
} from "@/services/trends";
