import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";

import {
  BreadBtiLinkIcon,
  BreadBtiMessageIcon,
  BreadBtiTwitterIcon,
} from "@/components/domain/breadbti/BreadBtiIcons";
import { BREAD_BTI_HOME_IMAGE } from "@/lib/breadbti/images";
import { breadBtiAbsoluteUrl, breadBtiPath } from "@/lib/breadbti/paths";
import {
  copyBreadBtiLink,
  openBreadBtiShareWindow,
  sendBreadBtiKakaoShare,
  useBreadBtiKakaoSdk,
} from "@/lib/breadbti/share";

const allResults = [
  { rank: 1, bread: "도넛", emoji: "🍩", mbti: "ENFP", count: 15234, percentage: 14.4 },
  { rank: 2, bread: "크로와상", emoji: "🥐", mbti: "INTJ", count: 12458, percentage: 11.8 },
  { rank: 3, bread: "바게트", emoji: "🥖", mbti: "ENTJ", count: 10892, percentage: 10.3 },
  { rank: 4, bread: "컵케이크", emoji: "🧁", mbti: "INFP", count: 9876, percentage: 9.3 },
  { rank: 5, bread: "베이글", emoji: "🥯", mbti: "ISFJ", count: 9234, percentage: 8.7 },
  { rank: 6, bread: "딸기 케이크", emoji: "🍓", mbti: "ESFP", count: 8765, percentage: 8.3 },
  { rank: 7, bread: "치즈케이크", emoji: "🍰", mbti: "INFJ", count: 8234, percentage: 7.8 },
  { rank: 8, bread: "프레첼", emoji: "🥨", mbti: "ENTP", count: 7543, percentage: 7.1 },
  { rank: 9, bread: "초코 크로와상", emoji: "🥐", mbti: "ISFP", count: 6892, percentage: 6.5 },
  { rank: 10, bread: "버터롤", emoji: "🍞", mbti: "ESFJ", count: 5876, percentage: 5.6 },
  { rank: 11, bread: "식빵", emoji: "🍞", mbti: "INTP", count: 4532, percentage: 4.3 },
  { rank: 12, bread: "통밀빵", emoji: "🍞", mbti: "ISTJ", count: 3456, percentage: 3.3 },
  { rank: 13, bread: "생크림 케이크", emoji: "🎂", mbti: "ENFJ", count: 2345, percentage: 2.2 },
  { rank: 14, bread: "핫도그", emoji: "🌭", mbti: "ESTP", count: 1876, percentage: 1.8 },
  { rank: 15, bread: "샌드위치", emoji: "🥪", mbti: "ISTP", count: 1234, percentage: 1.2 },
  { rank: 16, bread: "마늘바게트", emoji: "🥖", mbti: "ESTJ", count: 987, percentage: 0.9 },
];

export default function BreadBtiTotalResultPage() {
  const navigate = useNavigate();
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  useBreadBtiKakaoSdk();

  const shareText = "빵 MBTI 테스트 - 전체 유형 순위 보기";
  const shareUrl = breadBtiAbsoluteUrl(breadBtiPath("totalresult"));
  const shareImageUrl = breadBtiAbsoluteUrl(BREAD_BTI_HOME_IMAGE);

  const handleKakaoShare = () => {
    sendBreadBtiKakaoShare(
      {
        objectType: "feed",
        content: {
          title: "빵 MBTI 전체 유형 순위",
          imageUrl: shareImageUrl,
          description: shareText,
          link: {
            mobileWebUrl: shareUrl,
            webUrl: shareUrl,
          },
        },
        buttons: [
          {
            title: "순위 보러가기",
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
    <div className="min-h-screen bg-gradient-to-b from-[#FFF4E6] to-[#FFE8CC] pb-10">
      <header className="px-6 pt-10 pb-6">
        <h1 className="mb-2 text-center text-3xl font-bold text-[#D86A00]">전체 유형 순위</h1>
        <p className="text-center text-[#B87333]">가장 많이 나온 빵 유형은?</p>
      </header>

      <main className="px-6 lg:px-130">
        <div className="mb-8 space-y-3">
          {allResults.map((result) => (
            <div
              key={result.rank}
              className="flex items-center gap-3 rounded-2xl bg-white p-5 shadow-lg"
            >
              <div
                className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-base font-bold ${
                  result.rank === 1
                    ? "bg-gradient-to-br from-yellow-400 to-yellow-600 text-white"
                    : result.rank === 2
                      ? "bg-gradient-to-br from-gray-300 to-gray-500 text-white"
                      : result.rank === 3
                        ? "bg-gradient-to-br from-amber-600 to-amber-800 text-white"
                        : "bg-[#FFE8CC] text-[#D86A00]"
                }`}
              >
                {result.rank}
              </div>

              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="text-base font-bold whitespace-nowrap text-[#D86A00]">
                    {result.emoji}
                    {result.bread}
                  </span>
                  <span className="rounded-full bg-[#FF8C42] px-2 py-0.5 text-xs font-bold whitespace-nowrap text-white">
                    {result.mbti}
                  </span>
                </div>
                <div className="text-xs text-[#B87333]">{result.count.toLocaleString()}명 참여</div>
              </div>

              <div className="flex-shrink-0 text-right">
                <div className="text-xl font-bold text-[#FF8C42]">{result.percentage}%</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mb-4">
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
        </div>

        <button
          type="button"
          onClick={() => void navigate({ to: "/breadbti" })}
          className="w-full rounded-full bg-[#FF8C42] px-8 py-4 font-bold text-white shadow-lg transition-all hover:bg-[#FF7A1F] active:scale-95"
        >
          다시 테스트하기
        </button>

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
    </div>
  );
}
