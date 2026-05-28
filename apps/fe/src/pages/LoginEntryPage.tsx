import { useState } from "react";
import { AppIcon, IconAssets } from "@/components/icons";
import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { AppTopBar, Button } from "@/components/common";
import ComingSoonDialog from "@/components/common/dialog/ComingSoonDialog";
import MobileFrame from "@/components/layout/MobileFrame";
import breadTaxiImage from "@/assets/images/breadTaxi.png";
import { startGoogleLogin } from "@/lib/googleOAuth";
import { startKakaoLogin } from "@/lib/kakaoOAuth";
import { cn } from "@/utils/cn";

const loginEntryRouteApi = getRouteApi("/login-entry");

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

const SOCIAL_ICON_BY_PROVIDER = {
  kakao: IconAssets.IcLogoKakao,
  naver: IconAssets.IcLogoNaver,
  google: IconAssets.IcLogoGoogle,
  email: IconAssets.IcPerson,
} as const satisfies Record<(typeof SOCIAL_BUTTONS)[number]["id"], string>;

type SocialProvider = (typeof SOCIAL_BUTTONS)[number]["id"];

const socialButtonBaseClassName = cn(
  "relative flex h-x14 w-full items-center justify-center gap-x1-5 overflow-hidden rounded-r3",
  "px-x5 py-x4 text-size-4 font-medium leading-t5 tracking-1",
);

const heroTitleClassName = cn("text-size-7 font-bold leading-t8 tracking-2 text-gray-1000");
const footerLinkClassName = cn(
  "font-medium leading-t4 text-gray-700",
  "disabled:cursor-not-allowed disabled:text-gray-400",
);

export default function LoginEntryPage() {
  const navigate = useNavigate();
  const { redirect } = loginEntryRouteApi.useSearch();
  const [naverComingSoonOpen, setNaverComingSoonOpen] = useState(false);

  const handleSocialLogin = (provider: SocialProvider) => {
    if (provider === "email") {
      navigate({ to: "/login", search: { redirect } });
      return;
    }
    if (provider === "naver") {
      setNaverComingSoonOpen(true);
      return;
    }
    if (provider === "kakao") {
      void startKakaoLogin();
      return;
    }
    if (provider === "google") {
      void startGoogleLogin();
      return;
    }
  };

  return (
    <MobileFrame>
      <AppTopBar title="로그인" />

      <main className="relative flex flex-1 flex-col items-center gap-x4 py-x8">
        <img
          src={breadTaxiImage}
          alt=""
          aria-hidden
          className="absolute left-x5 top-x8 h-[64px] w-[64px] object-contain"
        />

        <section className="flex w-full flex-col items-center px-x5 pt-[104px] text-center">
          <div className="flex w-full flex-col items-center gap-x2">
            <p className={heroTitleClassName}>
              로그인하고 빵빵을
              <br />
              자유롭게 이용해보세요
            </p>
          </div>
        </section>

        <section className="flex w-full flex-col gap-x2 px-x5">
          {SOCIAL_BUTTONS.map(({ id, label, className }) => (
            <Button
              key={id}
              type="button"
              onClick={() => handleSocialLogin(id)}
              className={cn(socialButtonBaseClassName, className)}
            >
              <AppIcon src={SOCIAL_ICON_BY_PROVIDER[id]} size="x5" />
              {label}
            </Button>
          ))}
        </section>

        <nav
          aria-label="로그인 하단 링크"
          className="flex items-center gap-x3 text-size-3 tracking-1"
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

      <ComingSoonDialog open={naverComingSoonOpen} onClose={() => setNaverComingSoonOpen(false)} />
    </MobileFrame>
  );
}
