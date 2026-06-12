import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";

import {
  bindGa4FirstActionAfterLoginListener,
  initGtag,
  trackGtagPageView,
} from "@/lib/analytics/gtag";

/** SPA 라우트 변경 시 GA4 page_view 전송 */
export default function GoogleAnalytics() {
  const pagePath = useRouterState({
    select: (state) => `${state.location.pathname}${state.location.searchStr}`,
  });

  useEffect(() => {
    void initGtag().then(() => {
      trackGtagPageView(pagePath);
    });
  }, [pagePath]);

  useEffect(() => bindGa4FirstActionAfterLoginListener(), []);

  return null;
}
