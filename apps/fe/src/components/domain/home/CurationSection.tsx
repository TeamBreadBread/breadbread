// 큐레이션 문구 + 더보기 + 큰 하단 콘텐츠 영역
// SectionHeader(제목+더보기) + CurationBakeryContent(홈·빵터와 동일 API)
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import SectionHeader from "@/components/common/section-header/SectionHeader";
import Skeleton from "@/components/common/skeleton/Skeleton";
import { cn } from "@/utils/cn";
import { APP_SHELL_MAX_WIDTH } from "@/components/layout/layout.constants";
import { CurationBakeryContent } from "./CurationBakeryContent";

const CurationSection = () => {
  const navigate = useNavigate();
  const [displayedPinIds, setDisplayedPinIds] = useState<number[]>([]);

  const handleMoreClick = () => {
    void navigate({
      to: "/bbangteo-bakery-list",
      search: {
        from: "home" as const,
        curationPins: displayedPinIds.length > 0 ? displayedPinIds : undefined,
      },
    });
  };

  return (
    <section
      className={cn(
        "w-full bg-white",
        /* 헤더·카드(이미지 240 + 메타)·여백 합산 — 세로 스크롤 없이 한 블록에 들어가도록 */
        "min-h-[392px] sm:min-h-[408px] md:min-h-[424px]",
        "overflow-x-hidden overflow-y-visible",
        "px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6",
        APP_SHELL_MAX_WIDTH,
      )}
    >
      <div className="flex flex-col gap-[var(--spacing-x3)]">
        <SectionHeader
          title="큐레이션 문구"
          actionLabel="더보기"
          onActionClick={handleMoreClick}
          icon={
            <Skeleton shape="circle" className="h-[var(--spacing-x4-5)] w-[var(--spacing-x4-5)]" />
          }
        />

        <div className="w-full">
          <CurationBakeryContent
            bakeryListEntryFrom="home"
            onDisplayedBakeryIdsChange={setDisplayedPinIds}
          />
        </div>
      </div>
    </section>
  );
};

export default CurationSection;
