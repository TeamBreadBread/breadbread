/**
 * AI용 빵집 전체 목록 조회 (`GET /bakeries/ai`).
 *
 * @example
 * ```tsx
 * const { data, loading, error } = useBakeriesForAI();
 * ```
 */
import { useEffect, useState } from "react";
import { getBakeriesForAI } from "@/api/bakery";
import type { BakeryForAI } from "@/api/types/bakery";

function toError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }
  return new Error(typeof error === "string" ? error : "요청 중 오류가 발생했습니다.");
}

export function useBakeriesForAI() {
  const [data, setData] = useState<BakeryForAI[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    void getBakeriesForAI()
      .then((response) => {
        if (!cancelled) {
          setData(response);
          setError(null);
        }
      })
      .catch((errorUnknown: unknown) => {
        if (!cancelled) {
          setData(null);
          setError(toError(errorUnknown));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { data, loading, error };
}
