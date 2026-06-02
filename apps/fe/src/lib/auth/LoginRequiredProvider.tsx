import { useCallback, useMemo, useState, type ReactNode } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import BreadBotWidget from "@/components/domain/curator/BreadBotWidget";
import { isLoggedIn } from "@/lib/auth/isLoggedIn";
import { tryPostLoginRedirectPath } from "@/lib/postLoginRedirect";
import { LoginRequiredContext, type BotBubble } from "@/lib/auth/LoginRequiredContext";

const DEFAULT_LOGIN_BUBBLE_TEXT =
  "이 기능은 로그인이 필요해요.\n로그인하면 더 많은 기능을 사용할 수 있어요!";

/** 챗봇이 등장하면 어색한 경로 prefix (인증/온보딩/코스 생성/결제 등) */
const BOT_HIDDEN_PATH_PREFIXES = [
  // 로그인 / 회원가입 / 계정 인증
  "/login",
  "/signup",
  "/find-id",
  "/find-password",
  "/reset-password",
  "/password-reset-success",
  "/auth",
  // 코스 생성 로딩 · 에러 페이지 (AI 응답 대기/실패)
  "/ai-course-generating",
  // 온보딩(취향 선택) · 코스 생성 조건 입력 (지역/빵 종류/예산)
  "/user-preference",
  "/preference",
  "/recommendation",
  // 결제 페이지
  "/taxi-payment",
  "/payment",
];

export function LoginRequiredProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const botHidden = BOT_HIDDEN_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  const [bubble, setBubble] = useState<BotBubble | null>(null);
  const [redirectPath, setRedirectPath] = useState<string | undefined>();
  const [botCourseId, setBotCourseIdState] = useState<number | null>(null);

  const hideBubble = useCallback(() => {
    setBubble(null);
    setRedirectPath(undefined);
  }, []);

  const goLogin = useCallback(() => {
    const redirect = tryPostLoginRedirectPath(redirectPath);
    hideBubble();
    void navigate({
      to: "/login-entry",
      search: { redirect },
    });
  }, [hideBubble, navigate, redirectPath]);

  const requireLogin = useCallback((onAuthorized: () => void, returnPath?: string) => {
    if (isLoggedIn()) {
      onAuthorized();
      return;
    }
    setRedirectPath(returnPath);
    setBubble({ kind: "login", text: DEFAULT_LOGIN_BUBBLE_TEXT, redirectPath: returnPath });
  }, []);

  const promptLoginOnEnter = useCallback((returnPath?: string) => {
    if (isLoggedIn()) return;
    setRedirectPath(returnPath);
    setBubble({ kind: "login", text: DEFAULT_LOGIN_BUBBLE_TEXT, redirectPath: returnPath });
  }, []);

  const showInfoBubble = useCallback((text: string) => {
    setBubble({ kind: "info", text });
  }, []);

  const setBotCourseId = useCallback((courseId: number | null) => {
    setBotCourseIdState(courseId);
  }, []);

  const value = useMemo(
    () => ({ requireLogin, promptLoginOnEnter, showInfoBubble, setBotCourseId }),
    [requireLogin, promptLoginOnEnter, showInfoBubble, setBotCourseId],
  );

  return (
    <LoginRequiredContext.Provider value={value}>
      {children}
      {botHidden ? null : (
        <BreadBotWidget
          bubble={bubble}
          courseId={botCourseId}
          onGuestContinue={hideBubble}
          onGoLogin={goLogin}
          onCloseBubble={hideBubble}
        />
      )}
    </LoginRequiredContext.Provider>
  );
}
