/**
 * 빵집 목록 불러오기.
 *
 * @example
 * ```tsx
 * const { data, loading, error } = useBakeries({ page: 0, size: 10 });
 * if (loading) return <p>로딩 중...</p>;
 * if (error) return <p>{error.message}</p>;
 * return <ul>{data?.bakeries.map((b) => ...)}</ul>;
 * ```
 */
import { useEffect, useMemo, useState } from "react";
import { getBakeries } from "@/api/bakery";
import type { BakeryListResponse, GetBakeriesParams } from "@/api/types/bakery";

function toError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }
  return new Error(typeof error === "string" ? error : "요청 중 오류가 발생했습니다.");
}

export function useBakeries(params: GetBakeriesParams = {}) {
  const serialized = useMemo(() => JSON.stringify(params), [params]);

  const [state, setState] = useState<{
    key: string;
    data: BakeryListResponse | null;
    loading: boolean;
    error: Error | null;
  }>({
    key: serialized,
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    const parsed = JSON.parse(serialized) as GetBakeriesParams;

    void getBakeries(parsed)
      .then((response) => {
        if (!cancelled) {
          setState({
            key: serialized,
            data: response,
            loading: false,
            error: null,
          });
        }
      })
      .catch((errorUnknown: unknown) => {
        if (!cancelled) {
          setState({
            key: serialized,
            data: null,
            loading: false,
            error: toError(errorUnknown),
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [serialized]);

  const loading = state.key !== serialized || state.loading;
  const error = state.key === serialized ? state.error : null;
  const data = state.key === serialized ? state.data : null;

  return { data, loading, error };
}
