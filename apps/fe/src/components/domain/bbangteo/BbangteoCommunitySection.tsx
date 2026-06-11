import SectionHeader from "@/components/common/section-header/SectionHeader";
import { CurationBakeryContent } from "@/components/domain/home/CurationBakeryContent";
import { CURATION_BBANGTEO_DISPLAY_COUNT } from "@/components/domain/home/curationBakeryContentParams";
import type { ReactNode } from "react";
import type { CommunitySectionItem } from "./types";

const SUGGEST_BANNER_SECTION_EXTRA_HEIGHT = 72;

type BbangteoCommunitySectionProps = {
  section: CommunitySectionItem;
  topContent?: ReactNode;
  onMoreClick?: () => void;
  /** 큐레이션 카드 노출 순서 고정용 */
  onCurationDisplayedBakeryIdsChange?: (ids: number[]) => void;
  /** 제목 행 탭 시 (더보기 제외) — 예: 빵빵 소식에서 빵티클 탭 게시판으로 */
  onSectionTitleAreaClick?: () => void;
  onPostItemClick?: (item: NonNullable<CommunitySectionItem["postItems"]>[number]) => void;
};

const BbangteoCommunitySection = ({
  section,
  topContent,
  onMoreClick,
  onCurationDisplayedBakeryIdsChange,
  onSectionTitleAreaClick,
  onPostItemClick,
}: BbangteoCommunitySectionProps) => {
  const isCuration = section.contentType === "curationApi";
  const sectionStyle = isCuration
    ? { minHeight: section.sectionHeight }
    : topContent
      ? { minHeight: section.sectionHeight + SUGGEST_BANNER_SECTION_EXTRA_HEIGHT }
      : { height: section.sectionHeight };

  return (
    <section
      className={`w-full shrink-0 bg-white px-[20px] py-[18px] ${isCuration ? "" : "overflow-hidden"}`}
      style={sectionStyle}
    >
      <div
        className={`flex flex-col ${topContent ? "gap-[18px]" : "gap-[12px]"} ${isCuration ? "" : "h-full"}`}
      >
        {topContent}

        <div className={`flex flex-col gap-[12px] ${isCuration ? "" : "h-full min-h-0 flex-1"}`}>
          <SectionHeader
            title={section.title}
            titleClassName="typo-t6bold text-gray-1000"
            actionLabel="더보기"
            onActionClick={onMoreClick ?? (() => {})}
            onTitleAreaClick={onSectionTitleAreaClick}
            showDefaultIcon={false}
          />

          {section.contentType === "curationApi" ? (
            <div className="w-full shrink-0 overflow-y-hidden">
              <CurationBakeryContent
                compact
                displayCount={CURATION_BBANGTEO_DISPLAY_COUNT}
                bakeryListEntryFrom="bbangteo"
                lockSelectionOnMount
                onDisplayedBakeryIdsChange={onCurationDisplayedBakeryIdsChange}
              />
            </div>
          ) : section.contentType === "postList" ? (
            <div className="w-full min-h-0 flex-1 overflow-y-auto">
              <ul className="flex flex-col gap-[8px]">
                {(section.postItems ?? []).map((post, index) => (
                  <li
                    key={`${section.title}-${post.content}-${post.date}-${index}`}
                    className="flex items-center justify-between gap-[8px]"
                  >
                    <button
                      type="button"
                      onClick={() => onPostItemClick?.(post)}
                      className="flex w-full items-center justify-between gap-[8px] text-left"
                    >
                      <p className="flex-1 text-[14px] leading-[19px] font-medium text-gray-800">
                        {post.content}
                      </p>
                      <p className="text-[12px] leading-[16px] font-medium text-gray-400">
                        {post.date}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : section.imageSrc ? (
            <img
              width="362"
              height={section.imageHeight ?? 142}
              src={section.imageSrc}
              alt={section.title}
            />
          ) : (
            <div
              className="w-full rounded-[12px] bg-[#f3f4f5]"
              style={{ height: section.imageHeight }}
            />
          )}
        </div>
      </div>
    </section>
  );
};

export default BbangteoCommunitySection;
