// 동네 기반 큐레이션 섹션 (홈 2번째 블록)
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import SectionHeader from "@/components/common/section-header/SectionHeader";
import { cn } from "@/utils/cn";
import { APP_SHELL_MAX_WIDTH } from "@/components/layout/layout.constants";
import { buildBbangteoBakeryListSearch } from "@/utils/bakeryListEntry";
import { CurationBakeryContent } from "./CurationBakeryContent";
import type { DongOption } from "./dongCurationParams";

type DongCurationSectionProps = {
  selectedDong: DongOption;
  excludeBakeryIds?: number[];
  /** 1번 큐레이션 노출 확정 후 true */
  readyToPick?: boolean;
};

const DongCurationSection = ({
  selectedDong,
  excludeBakeryIds,
  readyToPick = false,
}: DongCurationSectionProps) => {
  const navigate = useNavigate();
  const [displayedPinIds, setDisplayedPinIds] = useState<number[]>([]);

  const handleMoreClick = () => {
    void navigate({
      to: "/bbangteo-bakery-list",
      search: buildBbangteoBakeryListSearch({
        from: "home",
        curationOnly: true,
        dong: selectedDong,
        curationPins: displayedPinIds.length > 0 ? displayedPinIds : [],
        excludePins: excludeBakeryIds ?? [],
      }),
    });
  };

  return (
    <section
      className={cn(
        "w-full bg-white",
        "min-h-[392px] sm:min-h-[408px] md:min-h-[424px]",
        "overflow-y-visible",
        "px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6",
        APP_SHELL_MAX_WIDTH,
      )}
    >
      <div className="flex flex-col gap-[var(--spacing-x3)]">
        <SectionHeader
          title={`느좋 빵집이 모여있는 ${selectedDong}`}
          titleClassName="font-sans typo-t6bold"
          showDefaultIcon={false}
          actionLabel="더보기"
          onActionClick={handleMoreClick}
        />

        <div className="min-w-0 w-full">
          <CurationBakeryContent
            bakeryListEntryFrom="home"
            useSummary
            listParamsOverride={{ size: 60, dong: selectedDong }}
            dongCardLabel={selectedDong}
            excludeBakeryIds={excludeBakeryIds}
            lockSelectionOnMount
            readyToPick={readyToPick}
            onDisplayedBakeryIdsChange={setDisplayedPinIds}
          />
        </div>
      </div>
    </section>
  );
};

export default DongCurationSection;
