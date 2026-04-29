/**
 * 단일 빵집 상세.
 *
 * @example
 * ```tsx
 * // 라우터에서 파싱한 숫자 id를 넘깁니다. (예: `/bakery/42`)
 * const id = Number(bakeryIdFromRouteString);
 * const { data, loading, error } = useBakeryDetail(Number.isNaN(id) ? undefined : id);
 * ```
 */
import { useEffect, useState } from "react";
import { getBakeryById } from "@/api/bakery";
import type { BakeryDetail } from "@/api/types/bakery";

function toError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }
  return new Error(typeof error === "string" ? error : "요청 중 오류가 발생했습니다.");
}

export function useBakeryDetail(bakeryId: number | undefined) {
  const enabled = bakeryId !== undefined && !Number.isNaN(bakeryId);
  const [state, setState] = useState<{
    key: number | undefined;
    data: BakeryDetail | null;
    loading: boolean;
    error: Error | null;
  }>({
    key: enabled ? bakeryId : undefined,
    data: null,
    loading: enabled,
    error: null,
  });

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let cancelled = false;

    void getBakeryById(bakeryId)
      .then((response) => {
        if (!cancelled) {
          setState({
            key: bakeryId,
            data: response,
            loading: false,
            error: null,
          });
        }
      })
      .catch((errorUnknown: unknown) => {
        if (!cancelled) {
          setState({
            key: bakeryId,
            data: null,
            loading: false,
            error: toError(errorUnknown),
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [bakeryId, enabled]);

  if (!enabled) {
    return { data: null, loading: false, error: null };
  }

  const loading = state.key !== bakeryId || state.loading;
  const error = state.key === bakeryId ? state.error : null;
  const data = state.key === bakeryId ? state.data : null;

  return { data, loading, error };
}
