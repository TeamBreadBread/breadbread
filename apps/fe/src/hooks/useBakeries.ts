/**
 * 빵집 목록 불러오기.
 *
 * @example
 * ```tsx
 * const { data, loading, error } = useBakeries({ page: 0, size: 10 });
 * const paused = useBakeries({ keyword: "단팥" }, { enabled: false });
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

type UseBakeriesOptions = {
  /** false이면 요청하지 않고 data/loading/error를 비움 */
  enabled?: boolean;
};

const bakeryListCache = new Map<string, BakeryListResponse>();
const bakeryListInflight = new Map<string, Promise<BakeryListResponse>>();

/**
 * 네트워크 요청 1번만 나가도록 dedupe하고 결과를 훅 캐시에 적재합니다.
 * 라우트 loader 등에서 먼저 호출하면 큐레이션 섹션까지 네트워크 왕복이 줄어듭니다.
 */
export function ensureBakeriesListLoaded(
  params: GetBakeriesParams = {},
): Promise<BakeryListResponse> {
  const serialized = JSON.stringify(params);
  const cached = bakeryListCache.get(serialized);
  if (cached) {
    return Promise.resolve(cached);
  }

  let pending = bakeryListInflight.get(serialized);
  if (!pending) {
    pending = getBakeries(JSON.parse(serialized) as GetBakeriesParams)
      .then((response) => {
        bakeryListCache.set(serialized, response);
        bakeryListInflight.delete(serialized);
        return response;
      })
      .catch((errorUnknown: unknown) => {
        bakeryListInflight.delete(serialized);
        throw errorUnknown;
      });
    bakeryListInflight.set(serialized, pending);
  }
  return pending;
}

export function useBakeries(params: GetBakeriesParams = {}, options?: UseBakeriesOptions) {
  const enabled = options?.enabled ?? true;
  const serialized = useMemo(() => JSON.stringify(params), [params]);
  const cachedForKey = enabled ? (bakeryListCache.get(serialized) ?? null) : null;

  const [state, setState] = useState<{
    key: string;
    data: BakeryListResponse | null;
    loading: boolean;
    error: Error | null;
  }>({
    key: serialized,
    data: cachedForKey,
    loading: cachedForKey === null,
    error: null,
  });

  useEffect(() => {
    if (!enabled) {
      return;
    }

    if (cachedForKey) {
      return;
    }

    let cancelled = false;
    const parsed = JSON.parse(serialized) as GetBakeriesParams;

    void ensureBakeriesListLoaded(parsed)
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
  }, [serialized, enabled, cachedForKey]);

  const loading = enabled && cachedForKey === null && (state.key !== serialized || state.loading);
  const error = enabled && state.key === serialized ? state.error : null;
  const data = enabled
    ? state.key === serialized
      ? (state.data ?? cachedForKey)
      : cachedForKey
    : null;

  return { data, loading, error };
}
