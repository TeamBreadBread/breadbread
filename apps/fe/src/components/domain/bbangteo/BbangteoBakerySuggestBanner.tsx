import { AppIcon, IconAssets } from "@/components/icons";
import QuestionBreadImage from "@/assets/images/QuestionBread.svg";
import { cn } from "@/utils/cn";
import { useNavigate } from "@tanstack/react-router";

type BbangteoBakerySuggestBannerProps = {
  className?: string;
};

export default function BbangteoBakerySuggestBanner({
  className,
}: BbangteoBakerySuggestBannerProps) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => void navigate({ to: "/bbangteo-bakery-suggest" })}
      className={cn(
        "flex w-full items-center gap-[12px] rounded-[12px] border border-[#ffe0d6] bg-[#fff8f5] px-[16px] py-[4px] text-left transition-opacity active:opacity-80",
        className,
      )}
    >
      <img
        src={QuestionBreadImage}
        alt=""
        aria-hidden
        className="h-[80px] w-[80px] shrink-0 -translate-y-[10px] object-contain"
      />
      <span className="flex min-w-0 flex-1 flex-col gap-[2px]">
        <span className="text-[14px] font-semibold leading-[19px] text-[#1a1c20]">
          알고 있는 빵집이 없나요?
        </span>
        <span className="text-[12px] leading-[17px] text-[#868b94]">
          빵집 알려주기 · 나만 아는 빵집 공유
        </span>
      </span>
      <AppIcon src={IconAssets.IcChevronLeft} size="x5" alt="" className="rotate-180 opacity-40" />
    </button>
  );
}
