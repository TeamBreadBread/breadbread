import { createRootRoute, Outlet, redirect } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import FcmNotificationListener from "@/components/FcmNotificationListener";
import { isLoggedIn } from "@/lib/auth/isLoggedIn";
import { isPublicPath } from "@/lib/auth/publicRoutes";
import { LoginRequiredProvider } from "@/lib/auth/LoginRequiredProvider";
import { parseLoginRedirectPath } from "@/lib/postLoginRedirect";

const showDevtools = import.meta.env.DEV && import.meta.env.VITE_ENABLE_DEVTOOLS === "true";

function RootErrorBoundary({ error }: { error: unknown }) {
  const detail =
    error instanceof Error ? error.message : typeof error === "string" ? error : "알 수 없는 오류";
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-x4 bg-gray-100 p-x6 text-center">
      <p className="text-size-6 font-bold text-gray-1000">문제가 발생했습니다</p>
      <p className="whitespace-pre-wrap text-size-4 text-gray-700">
        {import.meta.env.DEV ? detail : "잠시 후 다시 시도해 주세요."}
      </p>
      <button
        type="button"
        className="rounded-r3 bg-gray-800 px-x6 py-x3 text-size-4 font-bold text-gray-00"
        onClick={() => window.location.reload()}
      >
        새로고침
      </button>
    </div>
  );
}

export const Route = createRootRoute({
  beforeLoad: ({ location }) => {
    if (isLoggedIn() || isPublicPath(location.pathname)) return;

    throw redirect({
      to: "/login-entry",
      search: {
        redirect: parseLoginRedirectPath(location.pathname),
      },
    });
  },
  errorComponent: RootErrorBoundary,
  component: () => (
    <>
      <FcmNotificationListener />
      <div className="flex min-h-screen w-full items-center justify-center bg-gray-100">
        <div className="w-full max-w-[402px] bg-gray-00">
          <LoginRequiredProvider>
            <Outlet />
          </LoginRequiredProvider>
        </div>
      </div>
      {showDevtools && <TanStackRouterDevtools />}
    </>
  ),
});
