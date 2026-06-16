import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";

import BreadBtiMobileFrame from "@/components/domain/breadbti/BreadBtiMobileFrame";
import { isBreadBtiFromAiGenerating, isBreadBtiFromBbangteo } from "@/lib/breadbti/entryFrom";
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
  { name: "🥞", left: "6%", size: "2.75rem", delay: "0s", duration: "2.4s" },
  { name: "🥐", left: "17%", size: "2.75rem", delay: "0.2s", duration: "2.1s" },
  { name: "🍞", left: "28%", size: "2.75rem", delay: "0.4s", duration: "2.6s" },
  { name: "🥖", left: "39%", size: "2.75rem", delay: "0.1s", duration: "2.3s" },
  { name: "🥨", left: "50%", size: "2.75rem", delay: "0.5s", duration: "2.7s" },
  { name: "🥪", left: "61%", size: "2.75rem", delay: "0.3s", duration: "2.2s" },
  { name: "🍰", left: "72%", size: "2.75rem", delay: "0.6s", duration: "2.5s" },
  { name: "🍩", left: "83%", size: "2.75rem", delay: "0.8s", duration: "2.4s" },
  { name: "🍪", left: "94%", size: "2.75rem", delay: "0.7s", duration: "2.6s" },
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

  const fromBbangteo = isBreadBtiFromBbangteo();
  const fromAiGenerating = isBreadBtiFromAiGenerating();

  const startTest = () => {
    void navigate({ to: "/breadbti/question" });
  };

  return (
    <BreadBtiMobileFrame className="overflow-hidden">
      {fromBbangteo || fromAiGenerating ? null : (
        <header className="p-5 text-center">
          <div className="text-xs font-semibold text-[#FF8C42]">BREAD MBTI</div>
        </header>
      )}

      <main
        className={`flex flex-1 flex-col items-center px-5 pt-2 ${fromBbangteo ? "pb-24" : fromAiGenerating ? "pb-8" : "pb-36"}`}
      >
        <h1 className="text-center text-[44px] font-black leading-tight text-[#D86A00]">
          나는
          <br />
          어떤 빵일까?
        </h1>
        <p className="mt-3 text-center text-base text-[#B87333]">MBTI로 알아보는 나의 빵 성격</p>

        <div className="breadbti-hero-wrap mt-8 w-full max-w-[280px]">
          <div className="breadbti-hero-shadow" />
          <img
            src={BREAD_BTI_HOME_IMAGE}
            alt="Bread Character"
            className="breadbti-hero-image mb-0 block h-auto w-full"
          />
        </div>

        <button
          type="button"
          onClick={startTest}
          className="mt-8 w-full max-w-[280px] rounded-full bg-[#FF8C42] px-12 py-4 font-bold text-white shadow-lg transition-all hover:bg-[#FF7A10] active:scale-95"
        >
          테스트 시작하기
        </button>
        <div className="mt-4 text-sm text-[#B87333]">참여자수 | 105,789명</div>

        <div className="mt-8 w-full max-w-[280px]">
          <p className="mb-4 text-center text-sm font-semibold text-[#D86A00]">테스트 공유하기</p>
          <div className="flex justify-center gap-3">
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

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-36">
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
    </BreadBtiMobileFrame>
  );
}
