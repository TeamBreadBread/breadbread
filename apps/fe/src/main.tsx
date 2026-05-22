import { StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { appRouter } from "@/lib/appRouter";
import { isKakaoMapKeyConfigured, loadKakaoMapSdk } from "@/lib/kakaoMapSdk";
import "./index.css";

if (isKakaoMapKeyConfigured()) {
  void loadKakaoMapSdk().catch(() => {
    /* 지도 미사용 화면에서도 앱은 동작 */
  });
}

if (import.meta.env.DEV) {
  void import("@/lib/fcm/debugFcm").then(({ exposeFcmDebugOnWindow }) => {
    exposeFcmDebugOnWindow();
  });
}

const showDevtools = import.meta.env.DEV && import.meta.env.VITE_ENABLE_DEVTOOLS === "true";

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof appRouter;
  }
}

const queryClient = new QueryClient();

export const App = () => (
  <QueryClientProvider client={queryClient}>
    <RouterProvider router={appRouter} />
    {showDevtools && <ReactQueryDevtools />}
  </QueryClientProvider>
);

const rootElement = document.getElementById("root");

if (rootElement == null) {
  throw new Error("Root element '#root' not found");
}

declare global {
  interface Window {
    __BREADBREAD_APP_ROOT__?: Root;
  }
}

const root = window.__BREADBREAD_APP_ROOT__ ?? createRoot(rootElement);
window.__BREADBREAD_APP_ROOT__ = root;

root.render(
  <StrictMode>
    <App />
  </StrictMode>,
);
