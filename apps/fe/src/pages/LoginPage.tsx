import { useNavigate } from "@tanstack/react-router";
import ArrowLeft from "@/assets/icons/ArrowLeft.svg";
import { Button } from "@/components/common/Button";

const SOCIAL_BUTTONS = [
  {
    id: "kakao",
    label: "카카오로 계속하기",
    className: "bg-[#FEE500] text-[rgba(0,0,0,0.85)]",
  },
  {
    id: "naver",
    label: "네이버로 계속하기",
    className: "bg-[#03A94D] text-white",
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

const LoginPage = () => {
  const navigate = useNavigate();

  const handleSocialLogin = (provider: SocialProvider) => {
    // TODO: 소셜 로그인 연동
    void provider;
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* TopNavigation */}
      <header className="relative flex h-14 shrink-0 items-center justify-between border-b border-gray-300 px-x5 py-x2-5">
        <button
          type="button"
          onClick={() => navigate({ to: "/" })}
          className="flex size-9 items-center justify-center"
          aria-label="뒤로 가기"
        >
          <img src={ArrowLeft} alt="" className="size-6" />
        </button>
        <span className="absolute left-1/2 -translate-x-1/2 text-size-5 font-bold leading-t6 tracking-[-0.1px] text-gray-1000">
          로그인
        </span>
        <div className="size-9" />
      </header>

      <main className="flex flex-1 flex-col items-center gap-x4 py-x8">
        {/* 로고 & 앱 소개 */}
        <div className="flex w-full flex-col items-center gap-x7 p-x5">
          <div className="size-[100px] bg-gray-300" />
          <div className="flex w-full flex-col items-center gap-x2 text-center">
            <p className="text-size-7 font-bold leading-t8 tracking-[-0.2px] text-gray-1000">
              어쩌구 저쩌구
              <br />
              홍보 멘트~~
            </p>
            <p className="text-size-4 font-normal leading-t5 tracking-[-0.1px] text-gray-700">
              홍보멘트 설명이나 슬로건
            </p>
          </div>
        </div>

        {/* 소셜 로그인 버튼 */}
        <div className="flex w-full flex-col gap-x2-5 p-x5">
          {SOCIAL_BUTTONS.map(({ id, label, className }) => (
            <Button
              key={id}
              className={`relative flex h-14 w-full items-center justify-center gap-x1-5 overflow-hidden rounded-r3 px-x5 py-x4 text-size-4 font-medium leading-t5 tracking-[-0.1px] ${className}`}
              onClick={() => handleSocialLogin(id)}
            >
              {/* TODO: 소셜 아이콘 교체 */}
              <span className="size-[21px] shrink-0 rounded-full bg-gray-400" />
              {label}
            </Button>
          ))}
        </div>

        {/* 하단 링크 */}
        <div className="flex items-center gap-x3 text-size-3 tracking-[-0.1px]">
          <button
            type="button"
            aria-disabled="true"
            className="font-medium leading-t4 text-gray-700"
          >
            {/* TODO: 회원가입 라우트 연결 */}
            회원가입
          </button>
          <span className="font-normal leading-t4 text-gray-500">|</span>
          <button
            type="button"
            aria-disabled="true"
            className="font-medium leading-t4 text-gray-700"
          >
            {/* TODO: 아이디 찾기 라우트 연결 */}
            아이디 찾기
          </button>
          <span className="font-normal leading-t4 text-gray-500">|</span>
          <button
            type="button"
            aria-disabled="true"
            className="font-medium leading-t4 text-gray-700"
          >
            {/* TODO: 비밀번호 찾기 라우트 연결 */}
            비밀번호 찾기
          </button>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;
