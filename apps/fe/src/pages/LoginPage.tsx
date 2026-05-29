import { useState } from "react";
import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { login, setSessionTokens } from "@/api/auth";
import { getErrorMessage } from "@/api/types/common";
import { hasUserPreferenceSaved } from "@/api/user";
import { seedProfileCacheThenRefreshFromServer } from "@/lib/userProfileCache";
import { AppTopBar, Button } from "@/components/common";
import { PasswordToggleIcon } from "@/components/icons";
import MobileFrame from "@/components/layout/MobileFrame";
import { onAuthSessionEstablished } from "@/lib/fcm/setupFcm";
import { tryPostLoginRedirectPath } from "@/lib/postLoginRedirect";
import { cn } from "@/utils/cn";

const footerLinkClassName = cn(
  "font-medium leading-t4 text-gray-700",
  "disabled:cursor-not-allowed disabled:text-gray-400",
);

const credentialInputClassName = cn(
  "h-x12 w-full rounded-r2 border border-gray-300 bg-gray-00 px-x4",
  "hover:border-gray-300 focus:border-gray-300 focus:outline-none",
  "text-size-4 leading-t5 tracking-1 text-gray-1000 placeholder:text-gray-500",
);

const loginRouteApi = getRouteApi("/login");

const LoginPage = () => {
  const navigate = useNavigate();
  const { redirect } = loginRouteApi.useSearch();
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isLoginEnabled = userId.trim().length > 0 && password.trim().length > 0;

  const handleLogin = async () => {
    if (!isLoginEnabled || isSubmitting) return;
    setLoginError("");

    try {
      setIsSubmitting(true);
      const id = userId.trim();
      const tokens = await login({ loginId: id, password });
      setSessionTokens(tokens);
      onAuthSessionEstablished();
      seedProfileCacheThenRefreshFromServer(id);
      try {
        const nextPath = tryPostLoginRedirectPath(redirect);
        if (nextPath) {
          if (nextPath === "/bbangteo-board-write") {
            navigate({ to: nextPath, search: { editId: 0 } });
          } else {
            navigate({ to: nextPath });
          }
          return;
        }
        if (await hasUserPreferenceSaved()) {
          navigate({ to: "/home" });
        } else {
          navigate({ to: "/user-preference", search: { mode: "create" } });
        }
      } catch {
        const nextPath = tryPostLoginRedirectPath(redirect);
        if (nextPath) {
          if (nextPath === "/bbangteo-board-write") {
            navigate({ to: nextPath, search: { editId: 0 } });
          } else {
            navigate({ to: nextPath });
          }
        } else {
          navigate({ to: "/user-preference", search: { mode: "create" } });
        }
      }
    } catch (error) {
      setLoginError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MobileFrame>
      <AppTopBar title="아이디로 로그인" onBack={() => navigate({ to: "/home" })} />

      <main className="flex flex-1 flex-col items-center pb-x8 pt-[60px]">
        <form
          className="flex w-full flex-col px-x5"
          onSubmit={(event) => {
            event.preventDefault();
            void handleLogin();
          }}
        >
          <label className="font-pretendard typo-t4medium text-gray-800">아이디</label>
          <input
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
            className={cn(credentialInputClassName, "mt-x2")}
            placeholder="아이디를 입력해 주세요"
            autoComplete="username"
          />
          <label className="mt-x5 font-pretendard typo-t4medium text-gray-800">비밀번호</label>
          <div className="relative mt-x2 flex items-center">
            <input
              type={isPasswordVisible ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={cn(credentialInputClassName, "pr-12")}
              placeholder="비밀번호를 입력해 주세요"
              autoComplete="current-password"
            />
            <button
              type="button"
              aria-label={isPasswordVisible ? "비밀번호 숨기기" : "비밀번호 보기"}
              onClick={() => setIsPasswordVisible((prev) => !prev)}
              className="absolute right-x4 flex shrink-0 items-center justify-center"
            >
              <PasswordToggleIcon
                visible={isPasswordVisible}
                className={isPasswordVisible ? "text-gray-900" : "text-gray-700"}
              />
            </button>
          </div>
          {!!loginError && (
            <p className="mt-x2 pl-x1 text-size-3 leading-t4 tracking-1 text-red-500">
              {loginError}
            </p>
          )}
          <Button
            type="submit"
            disabled={!isLoginEnabled || isSubmitting}
            className={cn(
              "mt-x6 h-x12 w-full rounded-r3",
              isLoginEnabled && !isSubmitting ? "bg-gray-800" : "bg-gray-200",
            )}
          >
            {isSubmitting ? "로그인 중…" : "로그인"}
          </Button>
        </form>

        <nav
          aria-label="로그인 하단 링크"
          className="mt-[36px] flex items-center gap-x3 text-size-3 tracking-1"
        >
          <button
            type="button"
            className={footerLinkClassName}
            onClick={() => navigate({ to: "/signup" })}
          >
            회원가입
          </button>
          <span className="font-normal leading-t4 text-gray-500">|</span>
          <button
            type="button"
            className={footerLinkClassName}
            onClick={() => navigate({ to: "/find-id" })}
          >
            아이디 찾기
          </button>
          <span className="font-normal leading-t4 text-gray-500">|</span>
          <button
            type="button"
            className={footerLinkClassName}
            onClick={() => navigate({ to: "/find-password" })}
          >
            비밀번호 찾기
          </button>
        </nav>
      </main>
    </MobileFrame>
  );
};

export default LoginPage;
