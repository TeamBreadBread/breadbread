// 동네 기반 큐레이션 섹션 (홈 2번째 블록)
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import SectionHeader from "@/components/common/section-header/SectionHeader";
import { cn } from "@/utils/cn";
import { APP_SHELL_MAX_WIDTH } from "@/components/layout/layout.constants";
import { CurationBakeryContent } from "./CurationBakeryContent";

const DONG_OPTIONS = ["소제동", "은행동"] as const;

type DongCurationSectionProps = {
  excludeBakeryIds?: number[];
  /** 1번 큐레이션 노출 확정 후 true */
  readyToPick?: boolean;
};

const DongCurationSection = ({
  excludeBakeryIds,
  readyToPick = false,
}: DongCurationSectionProps) => {
  const navigate = useNavigate();
  const [displayedPinIds, setDisplayedPinIds] = useState<number[]>([]);
  const [selectedDong] = useState(
    () => DONG_OPTIONS[Math.floor(Math.random() * DONG_OPTIONS.length)]!,
  );

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
        "min-h-[392px] sm:min-h-[408px] md:min-h-[424px]",
        "overflow-x-hidden overflow-y-visible",
        "px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6",
        APP_SHELL_MAX_WIDTH,
      )}
    >
      <div className="flex flex-col gap-[var(--spacing-x3)]">
        <SectionHeader
          title={`느좋 빵집이 모여있는 ${selectedDong}`}
          titleClassName="typo-t6bold text-gray-1000"
          showDefaultIcon={false}
          actionLabel="더보기"
          onActionClick={handleMoreClick}
        />

        <div className="w-full">
          <CurationBakeryContent
            bakeryListEntryFrom="home"
            listParamsOverride={{ size: 60 }}
            excludeBakeryIds={excludeBakeryIds}
            localKeywordFilter={selectedDong}
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
