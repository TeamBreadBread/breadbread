import { useEffect } from "react";

import { markBreadBtiEntryFrom } from "@/lib/breadbti/entryFrom";

/** URL `?from=bbangteo|ai-generating` 진입 시 세션에 기록 */
export function usePersistBreadBtiEntryFrom(from?: "bbangteo" | "ai-generating") {
  useEffect(() => {
    if (from === "bbangteo" || from === "ai-generating") {
      markBreadBtiEntryFrom(from);
    }
  }, [from]);
}
