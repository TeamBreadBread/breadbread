// 큐레이션 문구 + 더보기 + 큰 하단 콘텐츠 영역
// SectionHeader(제목+더보기) + CurationBakeryContent(홈·빵터와 동일 API)
import { useState } from "react";
import type { GetBakeriesParams } from "@/api/types/bakery";
import { useNavigate } from "@tanstack/react-router";
import SectionHeader from "@/components/common/section-header/SectionHeader";
import { cn } from "@/utils/cn";
import { APP_SHELL_MAX_WIDTH } from "@/components/layout/layout.constants";
import { CurationBakeryContent } from "./CurationBakeryContent";

type CurationSectionProps = {
  title?: string;
  listParamsOverride?: Partial<GetBakeriesParams>;
  excludeBakeryIds?: number[];
  onDisplayedBakeryIdsChange?: (ids: number[]) => void;
};

const CurationSection = ({
  title = "대전에 왔으면 여긴 꼭 들려야지!",
  listParamsOverride,
  excludeBakeryIds,
  onDisplayedBakeryIdsChange,
}: CurationSectionProps = {}) => {
  const navigate = useNavigate();
  const [displayedPinIds, setDisplayedPinIds] = useState<number[]>([]);

  const handleMoreClick = () => {
    void navigate({
      to: "/bbangteo-bakery-list",
      search: {
        from: "home" as const,
        curationPins: displayedPinIds.length > 0 ? displayedPinIds : [],
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
          title={title}
          titleClassName="typo-t6bold text-gray-1000"
          showDefaultIcon={false}
          actionLabel="더보기"
          onActionClick={handleMoreClick}
        />

        <div className="w-full">
          <CurationBakeryContent
            bakeryListEntryFrom="home"
            listParamsOverride={listParamsOverride}
            excludeBakeryIds={excludeBakeryIds}
            lockSelectionOnMount
            onDisplayedBakeryIdsChange={(ids) => {
              setDisplayedPinIds(ids);
              onDisplayedBakeryIdsChange?.(ids);
            }}
          />
        </div>
      </div>
    </section>
  );
};

export default CurationSection;
