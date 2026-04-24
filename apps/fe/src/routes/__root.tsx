import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";

const showDevtools = import.meta.env.DEV && import.meta.env.VITE_ENABLE_DEVTOOLS === "true";

export const Route = createRootRoute({
  component: () => (
    <>
      <div className="flex min-h-screen w-full items-center justify-center bg-gray-100">
        <div className="w-full max-w-[744px] bg-gray-00">
          <Outlet />
        </div>
      </div>
      {showDevtools && <TanStackRouterDevtools />}
    </>
  ),
});
