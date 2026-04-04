import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";

const showDevtools = import.meta.env.VITE_SHOW_DEVTOOLS === "true";

export const Route = createRootRoute({
  component: () => (
    <>
      <Outlet />
      {showDevtools && <TanStackRouterDevtools />}
    </>
  ),
});
