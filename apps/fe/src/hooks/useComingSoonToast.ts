import { useCallback, useEffect, useState } from "react";

const TOAST_DURATION_MS = 2400;

export function useComingSoonToast() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!message) return undefined;
    const timer = window.setTimeout(() => setMessage(null), TOAST_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [message]);

  const showComingSoon = useCallback((customMessage = "준비 중인 기능이에요.") => {
    setMessage(customMessage);
  }, []);

  return { toastMessage: message, showComingSoon, clearToast: () => setMessage(null) };
}
