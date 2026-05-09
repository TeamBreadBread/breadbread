import BbangteoCommunitySection from "@/components/domain/bbangteo/BbangteoCommunitySection";
import BbangteoHeader from "@/components/domain/bbangteo/BbangteoHeader";
import BbangteoSearchSection from "@/components/domain/bbangteo/BbangteoSearchSection";
import BottomNav from "@/components/layout/BottomNav";
import type { CommunitySectionItem } from "@/components/domain/bbangteo/types";
import MobileFrame from "@/components/layout/MobileFrame";
import { MOCK_HOME_BBANGTICLE_PREVIEWS, MOCK_HOME_FREE_PREVIEWS } from "@/data/bbangteoBoardMock";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";

const sections: CommunitySectionItem[] = [
  {
    title: "큐레이션 문구",
    /** 헤더·패딩·축소 미리보기 카드(이미지 92 + 텍스트) 합에 맞춘 최소 높이 — 데이터는 홈과 동일 API */
    sectionHeight: 258,
    contentType: "curationApi",
  },
  {
    title: "자유 게시판",
    contentType: "postList",
    sectionHeight: 214,
    postItems: MOCK_HOME_FREE_PREVIEWS,
  },
  {
    title: "빵빵 소식",
    contentType: "postList",
    sectionHeight: 214,
    postItems: MOCK_HOME_BBANGTICLE_PREVIEWS,
  },
];

const BbangteoPage = () => {
  const navigate = useNavigate();
  const [curationDisplayedPinIds, setCurationDisplayedPinIds] = useState<number[]>([]);

  const goToBakeryList = () => {
    navigate({
      to: "/bbangteo-bakery-list",
      search: {
        from: "bbangteo" as const,
        curationPins: curationDisplayedPinIds.length > 0 ? curationDisplayedPinIds : undefined,
      },
    });
  };
  const goToBoardList = () => {
    navigate({ to: "/bbangteo-board", search: { listRefresh: undefined } });
  };
  const goToArticleBoardList = () => {
    navigate({ to: "/bbangteo-article-board" });
  };
  const handleCategoryClick = (label: "지역별" | "종류별" | "에디터픽" | "테마별") => {
    const toMap = {
      지역별: "/bbangteo-region-courses",
      종류별: "/bbangteo-type-courses",
      에디터픽: "/bbangteo-editor-pick-courses",
      테마별: "/bbangteo-theme-courses",
    } as const;
    navigate({ to: toMap[label] });
  };

  return (
    <MobileFrame className="bg-[#f3f4f5]">
      <div className="flex min-h-screen flex-1 flex-col bg-[#f3f4f5]">
        <BbangteoHeader title="빵터" />

        <main className="flex flex-1 flex-col gap-[10px] pb-[114px] sm:pb-[118px]">
          <BbangteoSearchSection onCategoryClick={handleCategoryClick} />
          {sections.map((section) => (
            <BbangteoCommunitySection
              key={section.title}
              section={section}
              onCurationDisplayedBakeryIdsChange={
                section.contentType === "curationApi" ? setCurationDisplayedPinIds : undefined
              }
              onSectionTitleAreaClick={
                section.title === "빵빵 소식" ? goToArticleBoardList : undefined
              }
              onMoreClick={
                section.title === "큐레이션 문구"
                  ? goToBakeryList
                  : section.title === "자유 게시판"
                    ? goToBoardList
                    : section.title === "빵빵 소식"
                      ? goToArticleBoardList
                      : undefined
              }
              onPostItemClick={
                section.title === "자유 게시판"
                  ? () => goToBoardList()
                  : section.title === "빵빵 소식"
                    ? () => goToArticleBoardList()
                    : undefined
              }
            />
          ))}
        </main>
      </div>

      <BottomNav />
    </MobileFrame>
  );
};

export default BbangteoPage;
