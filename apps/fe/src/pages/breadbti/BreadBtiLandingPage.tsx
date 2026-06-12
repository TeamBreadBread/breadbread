import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";

import { BREAD_BTI_HOME_IMAGE } from "@/lib/breadbti/images";
import { breadBtiAbsoluteUrl, breadBtiPath } from "@/lib/breadbti/paths";
import {
  copyBreadBtiLink,
  openBreadBtiShareWindow,
  sendBreadBtiKakaoShare,
  useBreadBtiKakaoSdk,
} from "@/lib/breadbti/share";
import {
  BreadBtiLinkIcon,
  BreadBtiMessageIcon,
  BreadBtiTwitterIcon,
} from "@/components/domain/breadbti/BreadBtiIcons";

import "@/styles/breadbti-landing.css";

const bouncingBreads = [
  { name: "🥞", left: "6%", size: "3.25rem", delay: "0s", duration: "2.4s" },
  { name: "🥐", left: "17%", size: "3.25rem", delay: "0.2s", duration: "2.1s" },
  { name: "🍞", left: "28%", size: "3.25rem", delay: "0.4s", duration: "2.6s" },
  { name: "🥖", left: "39%", size: "3.25rem", delay: "0.1s", duration: "2.3s" },
  { name: "🥨", left: "50%", size: "3.25rem", delay: "0.5s", duration: "2.7s" },
  { name: "🥪", left: "61%", size: "3.25rem", delay: "0.3s", duration: "2.2s" },
  { name: "🍰", left: "72%", size: "3.25rem", delay: "0.6s", duration: "2.5s" },
  { name: "🍩", left: "83%", size: "3.25rem", delay: "0.8s", duration: "2.4s" },
  { name: "🍪", left: "94%", size: "3.25rem", delay: "0.7s", duration: "2.6s" },
];

export default function BreadBtiLandingPage() {
  const navigate = useNavigate();
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  useBreadBtiKakaoSdk();

  const shareText = "나는 어떤 빵일까? MBTI 테스트 해보기";
  const shareUrl = breadBtiAbsoluteUrl(breadBtiPath());
  const shareImageUrl = breadBtiAbsoluteUrl(BREAD_BTI_HOME_IMAGE);

  const handleKakaoShare = () => {
    sendBreadBtiKakaoShare(
      {
        objectType: "feed",
        content: {
          title: "빵 MBTI 테스트",
          description: shareText,
          imageUrl: shareImageUrl,
          link: {
            mobileWebUrl: shareUrl,
            webUrl: shareUrl,
          },
        },
        buttons: [
          {
            title: "테스트 하러가기",
            link: {
              mobileWebUrl: shareUrl,
              webUrl: shareUrl,
            },
          },
        ],
      },
      shareUrl,
    );
  };

  const handleTwitterShare = () => {
    const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    openBreadBtiShareWindow(twitterShareUrl);
  };

  const handleCopyLink = async () => {
    await copyBreadBtiLink(shareUrl);
    setIsCopyModalOpen(true);
  };

  const startTest = () => {
    void navigate({ to: "/breadbti/question" });
  };

  const shareButtons = (
    <>
      <p className="mb-4 text-center text-sm font-semibold text-[#D86A00] lg:text-left">
        테스트 공유하기
      </p>
      <div className="flex justify-center gap-3 lg:justify-start">
        <button
          type="button"
          onClick={handleKakaoShare}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FEE500] shadow-md transition-all hover:bg-[#FDD000] active:scale-95"
        >
          <BreadBtiMessageIcon />
        </button>
        <button
          type="button"
          onClick={handleTwitterShare}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-black text-white shadow-md transition-all hover:bg-gray-800 active:scale-95"
        >
          <BreadBtiTwitterIcon />
        </button>
        <button
          type="button"
          onClick={() => void handleCopyLink()}
          className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#FF8C42] bg-white text-[#FF8C42] shadow-md transition-all hover:bg-gray-50 active:scale-95"
        >
          <BreadBtiLinkIcon />
        </button>
      </div>
    </>
  );

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-gradient-to-b from-[#FFF4E6] to-[#FFE8CC]">
      <header className="p-5 text-center lg:py-8">
        <div className="text-xs font-semibold text-[#FF8C42] lg:text-sm">BREAD MBTI</div>
      </header>

      <main className="flex-1 px-6 pb-16 lg:px-10 lg:pb-24">
        <div className="mx-auto flex min-h-full w-full max-w-6xl flex-col items-center justify-center gap-10 lg:grid lg:grid-cols-2 lg:gap-14">
          <section className="order-1 flex w-full max-w-xl flex-col items-center text-center lg:order-1 lg:items-start lg:text-left">
            <h1 className="text-5xl leading-tight font-black text-[#D86A00] lg:text-7xl">
              나는
              <br />
              어떤 빵일까?
            </h1>
            <p className="mt-3 text-base text-[#B87333] lg:text-xl">MBTI로 알아보는 나의 빵 성격</p>

            <button
              type="button"
              onClick={startTest}
              className="mt-8 hidden rounded-full bg-[#FF8C42] px-12 py-4 font-bold text-white shadow-lg transition-all hover:bg-[#FF7A10] active:scale-95 lg:inline-flex lg:px-16 lg:py-5 lg:text-lg"
            >
              테스트 시작하기
            </button>

            <div className="mt-4 hidden text-sm text-[#B87333] lg:block lg:text-base">
              참여자수 | 105,789명
            </div>

            <div className="mt-10 hidden w-full max-w-xs lg:block lg:max-w-sm">{shareButtons}</div>
          </section>

          <section className="order-2 flex w-full justify-center lg:order-2 lg:justify-end">
            <div className="breadbti-hero-wrap w-full max-w-md lg:max-w-xl">
              <div className="breadbti-hero-shadow" />
              <img
                src={BREAD_BTI_HOME_IMAGE}
                alt="Bread Character"
                className="breadbti-hero-image mb-0 block h-auto w-full"
              />
            </div>
          </section>

          <section className="order-3 flex w-full max-w-xs flex-col items-center lg:hidden">
            <button
              type="button"
              onClick={startTest}
              className="w-full rounded-full bg-[#FF8C42] px-12 py-4 font-bold text-white shadow-lg transition-all hover:bg-[#FF7A10] active:scale-95"
            >
              테스트 시작하기
            </button>
            <div className="mt-4 text-sm text-[#B87333]">참여자수 | 105,789명</div>
            <div className="mt-8 w-full">{shareButtons}</div>
          </section>
        </div>
      </main>

      {isCopyModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6">
          <div className="w-full max-w-xs rounded-2xl bg-white p-5 text-center shadow-xl">
            <p className="text-base font-semibold text-[#D86A00]">링크가 복사되었습니다.</p>
            <button
              type="button"
              onClick={() => setIsCopyModalOpen(false)}
              className="mt-4 w-full rounded-xl bg-[#FF8C42] py-2.5 font-bold text-white hover:bg-[#FF7A10]"
            >
              확인
            </button>
          </div>
        </div>
      ) : null}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 lg:h-52">
        {bouncingBreads.map((bread) => (
          <div
            key={bread.name}
            className="absolute bottom-[-42px] -translate-x-1/2"
            style={{ left: bread.left }}
          >
            <div
              className="breadbti-bounce leading-none"
              style={{
                fontSize: bread.size,
                animationDelay: bread.delay,
                animationDuration: bread.duration,
              }}
            >
              {bread.name}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
