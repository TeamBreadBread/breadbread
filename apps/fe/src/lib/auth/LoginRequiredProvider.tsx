import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import LoginRequiredDialog from "@/components/common/dialog/LoginRequiredDialog";
import BreadBotWidget from "@/components/domain/curator/BreadBotWidget";
import { getCurrentTour, type TourCurrentResponse } from "@/api/tours";
import { isBotFloatingHiddenPath } from "@/lib/courseGuide";
import { subscribeTourStateUpdate } from "@/utils/tourStateSync";
import { isLoggedIn } from "@/lib/auth/isLoggedIn";
import { tryPostLoginRedirectPath } from "@/lib/postLoginRedirect";
import { LoginRequiredContext } from "@/lib/auth/LoginRequiredContext";
import {
  clearPendingTourCompleteCelebration,
  markTourCompleteCelebration,
  readPendingTourCompleteCelebration,
} from "@/utils/tourCelebration";

export function LoginRequiredProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const loggedIn = isLoggedIn();

  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [redirectPath, setRedirectPath] = useState<string | undefined>();
  const [courseGuideActive, setCourseGuideActive] = useState(false);
  const [courseGuideId, setCourseGuideId] = useState<number | null>(null);
  const [pendingCelebrationCourseId, setPendingCelebrationCourseId] = useState<number | null>(() =>
    readPendingTourCompleteCelebration(),
  );

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
    clearPendingTourCompleteCelebration();
    setPendingCelebrationCourseId(null);
    setCourseGuideActive(true);
    setCourseGuideId(courseId);
  }, []);

  const endCourseGuide = useCallback(() => {
    setCourseGuideActive(false);
    setCourseGuideId(null);
  }, []);

  const startCelebrationPending = useCallback((courseId: number) => {
    if (!isLoggedIn() || courseId <= 0) return;
    markTourCompleteCelebration(courseId);
    setPendingCelebrationCourseId(courseId);
  }, []);

  const acknowledgeCelebration = useCallback(() => {
    clearPendingTourCompleteCelebration();
    setPendingCelebrationCourseId(null);
  }, []);

  const applyTourToCourseGuide = useCallback((tour: TourCurrentResponse | null) => {
    if (tour?.status === "IN_PROGRESS" && tour.courseId > 0) {
      clearPendingTourCompleteCelebration();
      setPendingCelebrationCourseId(null);
      setCourseGuideActive(true);
      setCourseGuideId(tour.courseId);
      return;
    }
    if (readPendingTourCompleteCelebration() == null) {
      setCourseGuideActive(false);
      setCourseGuideId(null);
    }
  }, []);

  /** 진행 중 투어(IN_PROGRESS)일 때만 코스 안내·챗봇 세션 유지 */
  useEffect(() => {
    if (!loggedIn) return;

    let cancelled = false;
    const refresh = () => {
      void getCurrentTour()
        .then((tour) => {
          if (!cancelled) applyTourToCourseGuide(tour);
        })
        .catch(() => {
          /* 조용히 무시 */
        });
    };

    refresh();
    const unsubscribe = subscribeTourStateUpdate((tour) => {
      applyTourToCourseGuide(tour);
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [loggedIn, pathname, applyTourToCourseGuide]);

  const resolvedCourseGuideActive = loggedIn && courseGuideActive;
  const resolvedCourseGuideId = loggedIn ? courseGuideId : null;

  const isBbangteoPath =
    pathname === "/bbangteo" ||
    pathname.startsWith("/bbangteo-") ||
    pathname.startsWith("/bbangteo/");
  /** 코스 안내 또는 축하 메시지 확인 전까지 BreadBot 노출 (투어 중 빵터 제외) */
  const showBot =
    loggedIn &&
    (resolvedCourseGuideActive || pendingCelebrationCourseId != null) &&
    !(isBbangteoPath && resolvedCourseGuideActive);
  const showBotFloating = showBot && !isBotFloatingHiddenPath(pathname);
  const botCourseId = resolvedCourseGuideId ?? pendingCelebrationCourseId;

  const value = useMemo(
    () => ({
      requireLogin,
      startCourseGuide,
      endCourseGuide,
      courseGuideActive: resolvedCourseGuideActive,
      courseGuideId: resolvedCourseGuideId,
      pendingCelebrationCourseId: loggedIn ? pendingCelebrationCourseId : null,
      startCelebrationPending,
      acknowledgeCelebration,
    }),
    [
      requireLogin,
      startCourseGuide,
      endCourseGuide,
      resolvedCourseGuideActive,
      resolvedCourseGuideId,
      pendingCelebrationCourseId,
      startCelebrationPending,
      acknowledgeCelebration,
      loggedIn,
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
