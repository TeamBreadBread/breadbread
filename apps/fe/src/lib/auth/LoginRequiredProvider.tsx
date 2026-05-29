import { useCallback, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import LoginRequiredDialog from "@/components/common/dialog/LoginRequiredDialog";
import { isLoggedIn } from "@/lib/auth/isLoggedIn";
import { tryPostLoginRedirectPath } from "@/lib/postLoginRedirect";
import { LoginRequiredContext } from "@/lib/auth/LoginRequiredContext";

export function LoginRequiredProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [redirectPath, setRedirectPath] = useState<string | undefined>();

  const closeDialog = useCallback(() => {
    setOpen(false);
    setRedirectPath(undefined);
  }, []);

  const goLogin = useCallback(() => {
    const redirect = tryPostLoginRedirectPath(redirectPath);
    closeDialog();
    void navigate({
      to: "/login-entry",
      search: { redirect },
    });
  }, [closeDialog, navigate, redirectPath]);

  const requireLogin = useCallback((onAuthorized: () => void, returnPath?: string) => {
    if (isLoggedIn()) {
      onAuthorized();
      return;
    }
    setRedirectPath(returnPath);
    setOpen(true);
  }, []);

  const value = useMemo(() => ({ requireLogin }), [requireLogin]);

  return (
    <LoginRequiredContext.Provider value={value}>
      {children}
      <LoginRequiredDialog open={open} onCancel={closeDialog} onLogin={goLogin} />
    </LoginRequiredContext.Provider>
  );
}
