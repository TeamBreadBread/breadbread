import { useQuery } from "@tanstack/react-query";
import { getTrendingBreads } from "@/services/trends";
import { trendQueryKeys } from "@/hooks/trend/trendQueryKeys";
import type { GetTrendingBreadsParams } from "@/types/trend";

type UseTrendingBreadsOptions = {
  enabled?: boolean;
};

const DEFAULT_PARAMS: GetTrendingBreadsParams = { page: 0, size: 10 };

export function useTrendingBreads(
  params: GetTrendingBreadsParams = DEFAULT_PARAMS,
  options?: UseTrendingBreadsOptions,
) {
  const resolvedParams = {
    ...DEFAULT_PARAMS,
    ...params,
    page: params.page ?? DEFAULT_PARAMS.page,
    size: params.size ?? DEFAULT_PARAMS.size,
  };

  return useQuery({
    queryKey: trendQueryKeys.breads(resolvedParams),
    queryFn: () => getTrendingBreads(resolvedParams),
    enabled: options?.enabled ?? true,
    staleTime: 60_000,
  });
}
