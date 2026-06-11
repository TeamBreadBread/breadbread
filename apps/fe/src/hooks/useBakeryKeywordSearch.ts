import { useEffect, useState } from "react";
import { getBakeries } from "@/api/bakery";
import type { BakeryListItem } from "@/api/types/bakery";
import { getErrorMessage } from "@/api/types/common";

const DEBOUNCE_MS = 350;

export function useBakeryKeywordSearch(keyword: string, enabled: boolean) {
  const [results, setResults] = useState<BakeryListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmed = keyword.trim();
  const shouldSearch = enabled && trimmed.length >= 1;

  useEffect(() => {
    if (!shouldSearch) {
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError(null);

      void getBakeries({ keyword: trimmed, page: 0, size: 10 })
        .then((response) => {
          if (!cancelled) setResults(response.bakeries);
        })
        .catch((errorUnknown) => {
          if (!cancelled) {
            setResults([]);
            setError(getErrorMessage(errorUnknown));
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [trimmed, shouldSearch]);

  return {
    results: shouldSearch ? results : [],
    loading: shouldSearch ? loading : false,
    error: shouldSearch ? error : null,
  };
}
