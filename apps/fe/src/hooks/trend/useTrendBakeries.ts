import { useQuery } from "@tanstack/react-query";
import { fetchTrendBakeries } from "@/services/trends";
import { trendQueryKeys } from "@/hooks/trend/trendQueryKeys";
import type { GetTrendBakeriesParams } from "@/types/trend";

type UseTrendBakeriesOptions = {
  enabled?: boolean;
};

export function useTrendBakeries(
  params: GetTrendBakeriesParams = {},
  options?: UseTrendBakeriesOptions,
) {
  const keyword = params.keyword?.trim() ?? "";

  return useQuery({
    queryKey: trendQueryKeys.bakeries(params),
    queryFn: () => fetchTrendBakeries(params),
    enabled: (options?.enabled ?? true) && keyword.length > 0,
    staleTime: 60_000,
  });
}
