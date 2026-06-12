import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import LoginRequiredDialog from "@/components/common/dialog/LoginRequiredDialog";
import BreadBotWidget from "@/components/domain/curator/BreadBotWidget";
import { getCurrentTour } from "@/api/tours";
import { isBotFloatingHiddenPath } from "@/lib/courseGuide";
import { isLoggedIn } from "@/lib/auth/isLoggedIn";
import { tryPostLoginRedirectPath } from "@/lib/postLoginRedirect";
import { readRouteFocusCourseId } from "@/utils/aiCourseStorage";
import { LoginRequiredContext } from "@/lib/auth/LoginRequiredContext";

function parseSearchCourseId(search: unknown): number | null {
  if (!search || typeof search !== "object") return null;
  const courseId = (search as { courseId?: unknown }).courseId;
  if (typeof courseId === "number" && Number.isFinite(courseId) && courseId > 0) {
    return Math.floor(courseId);
  }
  return null;
}

export function LoginRequiredProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const searchCourseId = useRouterState({
    select: (s) => parseSearchCourseId(s.location.search),
  });
  const routeFocusCourseId = pathname === "/route" ? readRouteFocusCourseId() : null;
  const loggedIn = isLoggedIn();

  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [redirectPath, setRedirectPath] = useState<string | undefined>();
  const [courseGuideActive, setCourseGuideActive] = useState(false);
  const [courseGuideId, setCourseGuideId] = useState<number | null>(null);

  const hideLoginDialog = useCallback(() => {
    setLoginDialogOpen(false);
    setRedirectPath(undefined);
  }, []);

  const goLogin = useCallback(() => {
    const redirect = tryPostLoginRedirectPath(redirectPath);
    hideLoginDialog();
    void navigate({
      to: "/login-entry",
      search: { redirect },
    });
  }, [hideLoginDialog, navigate, redirectPath]);

  const requireLogin = useCallback((onAuthorized: () => void, returnPath?: string) => {
    if (isLoggedIn()) {
      onAuthorized();
      return;
    }
    setRedirectPath(returnPath);
    setLoginDialogOpen(true);
  }, []);

  const startCourseGuide = useCallback((courseId: number) => {
    if (!isLoggedIn() || courseId <= 0) return;
    setCourseGuideActive(true);
    setCourseGuideId(courseId);
  }, []);

  const endCourseGuide = useCallback(() => {
    setCourseGuideActive(false);
    setCourseGuideId(null);
  }, []);

  /** 앱 재진입 시 진행 중 투어가 있으면 코스 안내 세션 복구 */
  useEffect(() => {
    if (!loggedIn) return;

    let cancelled = false;
    void getCurrentTour()
      .then((tour) => {
        if (cancelled) return;
        if (tour?.status === "IN_PROGRESS" && tour.courseId > 0) {
          setCourseGuideActive(true);
          setCourseGuideId(tour.courseId);
        } else {
          setCourseGuideActive(false);
          setCourseGuideId(null);
        }
      })
      .catch(() => {
        /* 조용히 무시 */
      });
    return () => {
      cancelled = true;
    };
  }, [loggedIn]);

  const resolvedCourseGuideActive = loggedIn && courseGuideActive;
  const resolvedCourseGuideId = loggedIn ? courseGuideId : null;

  const isHomePath = pathname === "/home";
  const isBbangteoPath =
    pathname === "/bbangteo" ||
    pathname.startsWith("/bbangteo-") ||
    pathname.startsWith("/bbangteo/");
  const isSavedRouteFlow =
    pathname === "/route" || searchCourseId != null || routeFocusCourseId != null;
  /** 로그인 사용자: 홈·저장 루트·코스 안내 중 BreadBot 노출 (코스 진행 중 빵터 제외) */
  const showBot =
    loggedIn &&
    (isHomePath || isSavedRouteFlow || resolvedCourseGuideActive) &&
    !(isBbangteoPath && resolvedCourseGuideActive);
  const showBotFloating = showBot && !isBotFloatingHiddenPath(pathname);
  const botCourseId = resolvedCourseGuideId ?? searchCourseId ?? routeFocusCourseId;

  const value = useMemo(
    () => ({
      requireLogin,
      startCourseGuide,
      endCourseGuide,
      courseGuideActive: resolvedCourseGuideActive,
      courseGuideId: resolvedCourseGuideId,
    }),
    [
      requireLogin,
      startCourseGuide,
      endCourseGuide,
      resolvedCourseGuideActive,
      resolvedCourseGuideId,
    ],
  );

  return (
    <LoginRequiredContext.Provider value={value}>
      {children}
      <LoginRequiredDialog open={loginDialogOpen} onCancel={hideLoginDialog} onLogin={goLogin} />
      {showBot ? (
        <BreadBotWidget courseId={botCourseId} showFloatingButton={showBotFloating} />
      ) : null}
    </LoginRequiredContext.Provider>
  );
}
