import type { GetTrendBakeriesParams, GetTrendBreadsParams } from "@/types/trend";

export const trendQueryKeys = {
  all: ["trends"] as const,
  breads: (params: GetTrendBreadsParams = {}) => [...trendQueryKeys.all, "breads", params] as const,
  bakeries: (params: GetTrendBakeriesParams = {}) =>
    [...trendQueryKeys.all, "bakeries", params] as const,
  breadBakeries: (keyword: string) => [...trendQueryKeys.all, "bread-bakeries", keyword] as const,
  menuFallback: () => [...trendQueryKeys.all, "menu-fallback"] as const,
};
