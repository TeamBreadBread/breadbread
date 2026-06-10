import { useQuery } from "@tanstack/react-query";
import { getBakeriesForAI } from "@/api/bakery";
import type { BakeryForAI } from "@/api/types/bakery";
import { trendQueryKeys } from "@/hooks/trend/trendQueryKeys";
import { findMostPopularBreadKeyword } from "@/utils/trendCuration";

export type TrendMenuIndex = {
  aiBakeries: BakeryForAI[];
  popularKeyword: string | null;
};

async function loadTrendMenuIndex(): Promise<TrendMenuIndex> {
  const aiBakeries = await getBakeriesForAI();
  return {
    aiBakeries,
    popularKeyword: findMostPopularBreadKeyword(aiBakeries),
  };
}

type UseTrendMenuIndexOptions = {
  enabled?: boolean;
};

/** DB 메뉴 인덱스 — 트렌드 API 보조·폴백용 */
export function useTrendMenuIndex(options?: UseTrendMenuIndexOptions) {
  return useQuery({
    queryKey: trendQueryKeys.menuFallback(),
    queryFn: loadTrendMenuIndex,
    enabled: options?.enabled ?? true,
    staleTime: 5 * 60_000,
  });
}

/** @deprecated useTrendMenuIndex */
export function useTrendMenuFallback(options?: UseTrendMenuIndexOptions) {
  return useTrendMenuIndex(options);
}
