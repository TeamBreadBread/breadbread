import { useNavigate } from "@tanstack/react-router";
import { AppTopBar, Button } from "@/components/common";
import MobileFrame from "@/components/layout/MobileFrame";
import { cn } from "@/utils/cn";

const SOCIAL_BUTTONS = [
  {
    id: "kakao",
    label: "카카오로 계속하기",
    className: "bg-[#FEE500] text-[rgba(0,0,0,0.85)]",
  },
  {
    id: "naver",
    label: "네이버로 계속하기",
    className: "bg-[#03A94D] text-gray-00",
  },
  {
    id: "google",
    label: "구글로 계속하기",
    className: "bg-[#F2F2F2] text-[#1F1F1F]",
  },
  {
    id: "email",
    label: "이메일로 계속하기",
    className: "bg-gray-00 text-gray-1000 border border-gray-300",
  },
] as const;

type SocialProvider = (typeof SOCIAL_BUTTONS)[number]["id"];

const socialButtonBaseClassName = cn(
  "relative flex h-x14 w-full items-center justify-center gap-x1-5 overflow-hidden rounded-r3",
  "px-x5 py-x4 text-size-4 font-medium leading-t5 tracking-1",
);

const heroTitleClassName = cn("text-size-7 font-bold leading-t8 tracking-2 text-gray-1000");

const heroDescriptionClassName = cn("text-size-4 font-normal leading-t5 tracking-1 text-gray-700");

const footerLinkClassName = cn(
  "font-medium leading-t4 text-gray-700",
  "disabled:cursor-not-allowed disabled:text-gray-400",
);

const LoginPage = () => {
  const navigate = useNavigate();

  const handleSocialLogin = (provider: SocialProvider) => {
    // TODO: 소셜 로그인 연동
    void provider;
  };

  return (
    <MobileFrame>
      <AppTopBar title="로그인" />

      <main className="flex flex-1 flex-col items-center gap-x4 py-x8">
        <section className="flex w-full flex-col items-center gap-x7 px-x5 text-center">
          <div className="size-x16 rounded-full bg-gray-300" />
          <div className="flex w-full flex-col items-center gap-x2">
            <p className={heroTitleClassName}>
              어쩌구 저쩌구
              <br />
              홍보 멘트~~
            </p>
            <p className={heroDescriptionClassName}>홍보멘트 설명이나 슬로건</p>
          </div>
        </section>

        <section className="flex w-full flex-col gap-x2-5 px-x5">
          {SOCIAL_BUTTONS.map(({ id, label, className }) => (
            <Button
              key={id}
              type="button"
              onClick={() => handleSocialLogin(id)}
              className={cn(socialButtonBaseClassName, className)}
            >
              <span className="size-x5 shrink-0 rounded-full bg-gray-400" />
              {label}
            </Button>
          ))}
        </section>

        <nav
          aria-label="로그인 하단 링크"
          className="flex items-center gap-x3 text-size-3 tracking-1"
        >
          <button type="button" disabled className={footerLinkClassName}>
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
          <button type="button" disabled className={footerLinkClassName}>
            비밀번호 찾기
          </button>
        </nav>
      </main>
    </MobileFrame>
  );
};

export default LoginPage;
