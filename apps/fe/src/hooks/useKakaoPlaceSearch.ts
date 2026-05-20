import { useEffect, useState } from "react";
import { getErrorMessage } from "@/api/types/common";
import {
  isKakaoPlaceSearchConfigured,
  searchKakaoPlacesByKeyword,
  type KakaoSearchPlace,
} from "@/lib/kakaoPlaceSearch";

const DEBOUNCE_MS = 350;

export function useKakaoPlaceSearch(query: string, enabled: boolean) {
  const [results, setResults] = useState<KakaoSearchPlace[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmed = query.trim();
  const shouldSearch = enabled && trimmed.length >= 1 && isKakaoPlaceSearchConfigured();

  useEffect(() => {
    if (!shouldSearch) return;

    let cancelled = false;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError(null);

      void searchKakaoPlacesByKeyword(trimmed)
        .then((items) => {
          if (!cancelled) setResults(items);
        })
        .catch((e) => {
          if (!cancelled) {
            setResults([]);
            setError(getErrorMessage(e));
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
