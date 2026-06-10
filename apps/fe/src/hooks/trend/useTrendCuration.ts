import { useMemo } from "react";
import { useTrendBakeries } from "@/hooks/trend/useTrendBakeries";
import { useTrendBreads } from "@/hooks/trend/useTrendBreads";
import { useTrendMenuIndex } from "@/hooks/trend/useTrendMenuFallback";
import type { TrendBakery, TrendBread, TrendCurationSource } from "@/types/trend";
import { hasTrendBakeryId, matchBakeriesByBreadKeyword } from "@/utils/trendCuration";

const DEFAULT_BREAD_SIZE = 10;
const DEFAULT_BAKERY_SIZE = 20;

export type TrendCurationViewModel = {
  keywords: TrendBread[];
  selectedKeyword: string;
  bakeries: TrendBakery[];
  totalCount: number;
  source: TrendCurationSource;
  isFallbackKeyword: boolean;
};

type UseTrendCurationOptions = {
  breadSize?: number;
  bakerySize?: number;
};

function mergeTrendAndMenuBakeries(
  trendBakeries: TrendBakery[],
  menuBakeries: TrendBakery[],
): TrendBakery[] {
  const merged = new Map<number, TrendBakery>();

  for (const bakery of trendBakeries.filter(hasTrendBakeryId)) {
    merged.set(bakery.bakeryId, bakery);
  }

  for (const bakery of menuBakeries.filter(hasTrendBakeryId)) {
    if (!merged.has(bakery.bakeryId)) {
      merged.set(bakery.bakeryId, bakery);
    }
  }

  return [...merged.values()];
}

export function useTrendCuration(options?: UseTrendCurationOptions) {
  const breadSize = options?.breadSize ?? DEFAULT_BREAD_SIZE;
  const bakerySize = options?.bakerySize ?? DEFAULT_BAKERY_SIZE;

  const breadsQuery = useTrendBreads({ page: 0, size: breadSize });
  const menuIndexQuery = useTrendMenuIndex({ enabled: breadsQuery.isSuccess });

  const hasTrendKeywords = (breadsQuery.data?.breads.length ?? 0) > 0;
  const popularKeyword = menuIndexQuery.data?.popularKeyword ?? "";
  const isFallbackKeyword = !hasTrendKeywords && Boolean(popularKeyword);

  const keywordChips: TrendBread[] = useMemo(() => {
    if (hasTrendKeywords) {
      return breadsQuery.data?.breads ?? [];
    }
    if (popularKeyword) {
      return [
        {
          keyword: popularKeyword,
          trendScore: null,
          trendStatus: null,
          growthRate: null,
          sources: null,
          collectedAt: "",
        },
      ];
    }
    return [];
  }, [breadsQuery.data?.breads, hasTrendKeywords, popularKeyword]);

  const selectedKeyword = useMemo(() => {
    return keywordChips[0]?.keyword?.trim() ?? "";
  }, [keywordChips]);

  const trendBakeriesQuery = useTrendBakeries(
    { keyword: selectedKeyword, page: 0, size: bakerySize },
    { enabled: hasTrendKeywords && Boolean(selectedKeyword) },
  );

  const viewModel = useMemo((): TrendCurationViewModel | null => {
    if (keywordChips.length === 0 || !selectedKeyword || !menuIndexQuery.data) {
      return null;
    }

    const menuMatched = matchBakeriesByBreadKeyword(
      menuIndexQuery.data.aiBakeries,
      selectedKeyword,
    );

    if (isFallbackKeyword) {
      if (menuMatched.length === 0) return null;
      return {
        keywords: keywordChips,
        selectedKeyword,
        bakeries: menuMatched,
        totalCount: menuMatched.length,
        source: "menu-fallback",
        isFallbackKeyword: true,
      };
    }

    const trendOnly = (trendBakeriesQuery.data?.bakeries ?? []).filter(hasTrendBakeryId);
    const merged = mergeTrendAndMenuBakeries(trendOnly, menuMatched);

    if (merged.length === 0) {
      return null;
    }

    const totalCount =
      trendOnly.length > 0 && trendBakeriesQuery.data?.hasNext
        ? trendBakeriesQuery.data.total
        : merged.length;

    const source: TrendCurationSource = trendOnly.length > 0 ? "trend-api" : "menu-fallback";

    return {
      keywords: keywordChips,
      selectedKeyword,
      bakeries: merged,
      totalCount,
      source,
      isFallbackKeyword: false,
    };
  }, [
    isFallbackKeyword,
    keywordChips,
    menuIndexQuery.data,
    selectedKeyword,
    trendBakeriesQuery.data,
  ]);

  const loading =
    breadsQuery.isLoading ||
    (breadsQuery.isSuccess && menuIndexQuery.isLoading) ||
    (hasTrendKeywords &&
      Boolean(selectedKeyword) &&
      trendBakeriesQuery.isLoading &&
      !isFallbackKeyword);

  const error = breadsQuery.error ?? menuIndexQuery.error ?? trendBakeriesQuery.error;

  return {
    viewModel,
    loading,
    error,
    selectedKeyword,
    refetch: () => {
      void breadsQuery.refetch();
      void menuIndexQuery.refetch();
      void trendBakeriesQuery.refetch();
    },
  };
}
