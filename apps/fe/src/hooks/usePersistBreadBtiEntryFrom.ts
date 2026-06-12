import { useEffect } from "react";

import { markBreadBtiEntryFrom } from "@/lib/breadbti/entryFrom";

/** URL `?from=bbangteo` 진입 시 세션에 기록 */
export function usePersistBreadBtiEntryFrom(from?: "bbangteo") {
  useEffect(() => {
    if (from === "bbangteo") {
      markBreadBtiEntryFrom("bbangteo");
    }
  }, [from]);
}
