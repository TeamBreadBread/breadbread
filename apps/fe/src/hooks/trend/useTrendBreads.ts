import { useQuery } from "@tanstack/react-query";
import { fetchTrendBreads } from "@/services/trends";
import { trendQueryKeys } from "@/hooks/trend/trendQueryKeys";
import type { GetTrendBreadsParams } from "@/types/trend";

type UseTrendBreadsOptions = {
  enabled?: boolean;
};

export function useTrendBreads(params: GetTrendBreadsParams = {}, options?: UseTrendBreadsOptions) {
  return useQuery({
    queryKey: trendQueryKeys.breads(params),
    queryFn: () => fetchTrendBreads(params),
    enabled: options?.enabled ?? true,
    staleTime: 60_000,
  });
}
