import { StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { routeTree } from "./routeTree.gen";
import "./index.css";

const router = createRouter({ routeTree });
const showDevtools = import.meta.env.DEV && import.meta.env.VITE_ENABLE_DEVTOOLS === "true";

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const queryClient = new QueryClient();

export const App = () => (
  <QueryClientProvider client={queryClient}>
    <RouterProvider router={router} />
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
