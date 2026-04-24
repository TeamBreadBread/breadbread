import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";

const showDevtools = import.meta.env.DEV && import.meta.env.VITE_ENABLE_DEVTOOLS === "true";

export const Route = createRootRoute({
  component: () => (
    <>
      <Outlet />
      {showDevtools && <TanStackRouterDevtools />}
    </>
  ),
});
