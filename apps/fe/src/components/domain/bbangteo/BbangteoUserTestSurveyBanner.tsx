import { AppIcon, IconAssets } from "@/components/icons";
import { BBANGTEO_USER_TEST_SURVEY_URL } from "@/lib/bbangteoUserTestSurvey";
import { cn } from "@/utils/cn";

type BbangteoUserTestSurveyBannerProps = {
  className?: string;
};

export default function BbangteoUserTestSurveyBanner({
  className,
}: BbangteoUserTestSurveyBannerProps) {
  return (
    <a
      href={BBANGTEO_USER_TEST_SURVEY_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "flex w-full items-center gap-[12px] rounded-[12px] border border-[#ffd4a8] bg-gradient-to-r from-[#fff4e6] to-[#ffe8cc] px-[16px] py-[12px] text-left transition-opacity active:opacity-80",
        className,
      )}
    >
      <span
        className="flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-full bg-white/80 shadow-[0_1px_4px_rgba(216,106,0,0.12)]"
        aria-hidden
      >
        <AppIcon src={IconAssets.IcPersons} size={24} className="icon-orange-600" alt="" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-[2px]">
        <span className="text-[14px] font-semibold leading-[19px] text-[#D86A00]">
          빵빵 User Test
        </span>
        <span className="text-[12px] leading-[17px] text-[#B87333]">
          설문 참여하고 서비스 개선에 함께해 주세요
        </span>
      </span>
      <AppIcon src={IconAssets.IcChevronLeft} size="x5" alt="" className="rotate-180 opacity-40" />
    </a>
  );
}
