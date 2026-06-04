import { useEffect, useMemo, useState } from "react";
import { getBakeriesSummary } from "@/api/bakery";
import type { BakerySummaryListResponse, GetBakeriesParams } from "@/api/types/bakery";

function toError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }
  return new Error(typeof error === "string" ? error : "요청 중 오류가 발생했습니다.");
}

type UseBakeriesSummaryOptions = {
  enabled?: boolean;
};

const summaryCache = new Map<string, BakerySummaryListResponse>();
const summaryInflight = new Map<string, Promise<BakerySummaryListResponse>>();

export function ensureBakeriesSummaryLoaded(
  params: GetBakeriesParams = {},
): Promise<BakerySummaryListResponse> {
  const serialized = JSON.stringify(params);
  const cached = summaryCache.get(serialized);
  if (cached) {
    return Promise.resolve(cached);
  }

  let pending = summaryInflight.get(serialized);
  if (!pending) {
    pending = getBakeriesSummary(JSON.parse(serialized) as GetBakeriesParams)
      .then((response) => {
        summaryCache.set(serialized, response);
        summaryInflight.delete(serialized);
        return response;
      })
      .catch((errorUnknown: unknown) => {
        summaryInflight.delete(serialized);
        throw errorUnknown;
      });
    summaryInflight.set(serialized, pending);
  }
  return pending;
}

export function useBakeriesSummary(
  params: GetBakeriesParams = {},
  options?: UseBakeriesSummaryOptions,
) {
  const enabled = options?.enabled ?? true;
  const serialized = useMemo(() => JSON.stringify(params), [params]);
  const cachedForKey = enabled ? (summaryCache.get(serialized) ?? null) : null;

  const [state, setState] = useState<{
    key: string;
    data: BakerySummaryListResponse | null;
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

    void ensureBakeriesSummaryLoaded(parsed)
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
