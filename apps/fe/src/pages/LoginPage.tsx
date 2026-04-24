import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { AppTopBar, Button } from "@/components/common";
import MobileFrame from "@/components/layout/MobileFrame";
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

const LoginPage = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const isLoginEnabled = userId.trim().length > 0 && password.trim().length > 0;

  const handleLogin = () => {
    if (userId === "asdf123" && password === "asdf123*") {
      setLoginError("");
      navigate({ to: "/user-preference" });
      return;
    }

    setLoginError("아이디 또는 비밀번호가 올바르지 않습니다.");
  };

  return (
    <MobileFrame>
      <AppTopBar title="아이디로 로그인" />

      <main className="flex flex-1 flex-col items-center pb-x8 pt-[60px]">
        <section className="flex w-full flex-col px-x5">
          <label className="font-pretendard typo-t4medium text-gray-800">아이디</label>
          <input
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
            className={cn(credentialInputClassName, "mt-x2")}
            placeholder="아이디를 입력해 주세요"
          />
          <label className="mt-x5 font-pretendard typo-t4medium text-gray-800">비밀번호</label>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={cn(credentialInputClassName, "mt-x2")}
            placeholder="비밀번호를 입력해 주세요"
          />
          {!!loginError && (
            <p className="mt-x2 pl-x1 text-size-3 leading-t4 tracking-1 text-red-500">
              {loginError}
            </p>
          )}
          <Button
            type="button"
            disabled={!isLoginEnabled}
            className={cn(
              "mt-x6 h-x12 w-full rounded-r3",
              isLoginEnabled ? "bg-gray-800" : "bg-gray-200",
            )}
            onClick={handleLogin}
          >
            로그인
          </Button>
        </section>

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
