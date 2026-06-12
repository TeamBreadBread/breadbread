import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";

import { BreadBtiImageWithFallback } from "@/components/domain/breadbti/BreadBtiImageWithFallback";
import BreadBtiMobileFrame from "@/components/domain/breadbti/BreadBtiMobileFrame";
import {
  BreadBtiChartIcon,
  BreadBtiLinkIcon,
  BreadBtiMessageIcon,
  BreadBtiThumbsDownIcon,
  BreadBtiThumbsUpIcon,
  BreadBtiTwitterIcon,
} from "@/components/domain/breadbti/BreadBtiIcons";
import { BREAD_EMOJI_MAP, MBTI_IMAGE_MAP } from "@/lib/breadbti/images";
import { isMbtiType, MBTI_PROFILE_MAP, type MbtiType } from "@/lib/breadbti/mbti";
import {
  BREAD_BTI_RESULT_STORAGE_KEY,
  breadBtiAbsoluteUrl,
  breadBtiPath,
} from "@/lib/breadbti/paths";
import { clearBreadBtiEntryFrom } from "@/lib/breadbti/entryFrom";
import {
  copyBreadBtiLink,
  openBreadBtiShareWindow,
  sendBreadBtiKakaoShare,
  useBreadBtiKakaoSdk,
} from "@/lib/breadbti/share";

const formatMatchLabel = (bread: string, mbti: MbtiType) => {
  const emoji = BREAD_EMOJI_MAP[bread] ?? "🥐";
  return `${bread} ${emoji}(${mbti})`;
};

export default function BreadBtiResultPage() {
  const navigate = useNavigate();
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  useBreadBtiKakaoSdk();

  const normalizedCandidate = (sessionStorage.getItem(BREAD_BTI_RESULT_STORAGE_KEY) ?? "")
    .trim()
    .toUpperCase();
  const mbti: MbtiType = isMbtiType(normalizedCandidate) ? normalizedCandidate : "INTJ";

  const profile = MBTI_PROFILE_MAP[mbti];
  const mbtiImage = MBTI_IMAGE_MAP[mbti];
  const shareText = `나는 ${mbti} ${profile.bread} 타입! 빵 MBTI 테스트 해보기`;
  const shareUrl = breadBtiAbsoluteUrl(breadBtiPath());
  const shareImageUrl = breadBtiAbsoluteUrl(mbtiImage);

  const handleKakaoShare = () => {
    sendBreadBtiKakaoShare(
      {
        objectType: "feed",
        content: {
          title: `${mbti} ${profile.bread} 타입 결과`,
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

  return (
    <BreadBtiMobileFrame>
      <main className="flex-1 px-5 pb-10 pt-8">
        <section className="rounded-[2rem] bg-white/50 p-6 shadow-lg backdrop-blur-sm">
          <div className="mb-4 flex items-center justify-center">
            <div className="h-64 w-64 overflow-hidden rounded-3xl">
              <BreadBtiImageWithFallback
                src={mbtiImage}
                alt={`${mbti} bread result image`}
                className="mx-auto h-full w-full object-contain"
              />
            </div>
          </div>

          <h1 className="mb-2 text-center text-3xl font-bold text-[#D86A00]">
            당신은 {profile.bread}
          </h1>
          <p className="mb-6 text-center text-base text-[#B87333]">{profile.oneLine}</p>

          <p className="mb-4 text-center text-sm font-semibold text-[#D86A00]">결과 공유하기</p>
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
        </section>

        <div className="mt-6 rounded-2xl bg-white p-5 shadow-lg">
          <div className="mb-4 inline-block rounded-full bg-[#FF8C42] px-4 py-2 text-lg font-bold text-white">
            {mbti}
          </div>
          <p className="leading-relaxed text-[#5A4A3A]">{profile.description}</p>
        </div>

        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-lg">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#FFE8CC] text-[#FF8C42]">
              <BreadBtiThumbsUpIcon />
            </div>
            <div className="min-w-0">
              <div className="mb-1 text-sm text-[#B87333]">잘 맞는 빵</div>
              <div className="font-bold text-[#D86A00]">
                {profile.goodMatches
                  .map((match) => formatMatchLabel(match.bread, match.mbti))
                  .join(", ")}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-lg">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#FFE8CC] text-[#B87333]">
              <BreadBtiThumbsDownIcon />
            </div>
            <div className="min-w-0">
              <div className="mb-1 text-sm text-[#B87333]">안 맞는 빵</div>
              <div className="font-bold text-[#D86A00]">
                {profile.badMatches
                  .map((match) => formatMatchLabel(match.bread, match.mbti))
                  .join(", ")}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <button
            type="button"
            onClick={() => void navigate({ to: "/breadbti/totalresult" })}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[#FF8C42] px-8 py-4 font-bold text-white shadow-lg transition-all hover:bg-[#FF7A1F] active:scale-95"
          >
            <BreadBtiChartIcon />
            전체 유형 보러가기
          </button>

          <button
            type="button"
            onClick={() => void navigate({ to: "/breadbti" })}
            className="w-full rounded-full border-2 border-[#FF8C42] bg-white px-8 py-4 font-bold text-[#FF8C42] shadow-lg transition-all hover:bg-[#FFF4E6] active:scale-95"
          >
            다시 테스트하기
          </button>

          <button
            type="button"
            onClick={() => {
              clearBreadBtiEntryFrom();
              void navigate({ to: "/home" });
            }}
            className="w-full rounded-full border-2 border-[#FFE8CC] bg-[#FFF4E6] px-8 py-4 font-bold text-[#D86A00] shadow-lg transition-all hover:bg-[#FFE8CC] active:scale-95"
          >
            홈페이지로 돌아가기
          </button>
        </div>

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
      </main>
    </BreadBtiMobileFrame>
  );
}
