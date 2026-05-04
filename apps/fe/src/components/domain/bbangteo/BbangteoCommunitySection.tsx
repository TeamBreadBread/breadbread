import SectionHeader from "@/components/common/section-header/SectionHeader";
import { CurationBakeryContent } from "@/components/domain/home/CurationBakeryContent";
import type { CommunitySectionItem } from "./types";

const CircleIcon = ({ size, color }: { size: number; color: string }) => {
  return (
    <div className="flex items-center justify-center p-[3px]">
      <div
        className="shrink-0 rounded-full"
        style={{ width: size, height: size, backgroundColor: color }}
      />
    </div>
  );
};

type BbangteoCommunitySectionProps = {
  section: CommunitySectionItem;
  onMoreClick?: () => void;
  /** 제목 행 탭 시 (더보기 제외) — 예: 빵빵 소식에서 빵티클 탭 게시판으로 */
  onSectionTitleAreaClick?: () => void;
  onPostItemClick?: (item: NonNullable<CommunitySectionItem["postItems"]>[number]) => void;
};

const BbangteoCommunitySection = ({
  section,
  onMoreClick,
  onSectionTitleAreaClick,
  onPostItemClick,
}: BbangteoCommunitySectionProps) => {
  const isCuration = section.contentType === "curationApi";

  return (
    <section
      className={`shrink-0 bg-white px-[20px] py-[18px] ${isCuration ? "" : "overflow-hidden"}`}
      style={isCuration ? { minHeight: section.sectionHeight } : { height: section.sectionHeight }}
    >
      <div className={`flex flex-col gap-[12px] ${isCuration ? "" : "h-full"}`}>
        <SectionHeader
          title={section.title}
          actionLabel="더보기"
          onActionClick={onMoreClick ?? (() => {})}
          onTitleAreaClick={onSectionTitleAreaClick}
          icon={<CircleIcon size={18} color="#dcdee3" />}
        />

        {section.contentType === "curationApi" ? (
          <div className="w-full shrink-0 overflow-y-hidden">
            <CurationBakeryContent compact bakeryListEntryFrom="bbangteo" />
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
    </section>
  );
};

export default BbangteoCommunitySection;
