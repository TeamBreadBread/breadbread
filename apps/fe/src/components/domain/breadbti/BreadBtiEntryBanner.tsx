import { useNavigate } from "@tanstack/react-router";

import { AppIcon, IconAssets } from "@/components/icons";
import { BREAD_BTI_HOME_IMAGE } from "@/lib/breadbti/images";
import { markBreadBtiEntryFrom } from "@/lib/breadbti/entryFrom";
import { cn } from "@/utils/cn";

type BreadBtiEntryBannerProps = {
  className?: string;
};

/** 빵터 등에서 BreadBTI 테스트로 유도하는 배너 */
export default function BreadBtiEntryBanner({ className }: BreadBtiEntryBannerProps) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => {
        markBreadBtiEntryFrom("bbangteo");
        void navigate({ to: "/breadbti", search: { from: "bbangteo" } });
      }}
      className={cn(
        "flex w-full items-center gap-[12px] rounded-[12px] border border-[#ffd4a8] bg-gradient-to-r from-[#fff4e6] to-[#ffe8cc] px-0 py-0 text-left transition-opacity active:opacity-80",
        className,
      )}
    >
      <img
        src={BREAD_BTI_HOME_IMAGE}
        alt=""
        aria-hidden
        className="h-[77px] w-[77px] shrink-0 object-contain"
      />
      <span className="flex min-w-0 flex-1 flex-col gap-[2px]">
        <span className="text-[14px] font-semibold leading-[19px] text-[#D86A00]">
          나는 어떤 빵 타입일까?
        </span>
        <span className="text-[12px] leading-[17px] text-[#B87333]">BreadBTI 테스트 하러가기</span>
      </span>
      <AppIcon
        src={IconAssets.IcChevronLeft}
        size="x5"
        alt=""
        className="mr-[5px] shrink-0 rotate-180 opacity-40"
      />
    </button>
  );
}
