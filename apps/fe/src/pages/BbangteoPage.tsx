import BbangteoBakerySuggestBanner from "@/components/domain/bbangteo/BbangteoBakerySuggestBanner";
import BbangteoCommunitySection from "@/components/domain/bbangteo/BbangteoCommunitySection";
import BbangteoHeader from "@/components/domain/bbangteo/BbangteoHeader";
import BbangteoSearchSection from "@/components/domain/bbangteo/BbangteoSearchSection";
import TrendHotBreadsSection from "@/components/domain/trend/TrendHotBreadsSection";
import TrendCurationSection from "@/components/domain/trend/TrendCurationSection";
import BottomNav from "@/components/layout/BottomNav";
import type { CommunitySectionItem } from "@/components/domain/bbangteo/types";
import MobileFrame from "@/components/layout/MobileFrame";
import {
  BBANGTEO_HOME_FREE_POST_ITEMS,
  BBANGTEO_HOME_NEWS_POST_ITEMS,
} from "@/data/bbangteoCommunityMocks";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { buildBbangteoBakeryListSearch } from "@/utils/bakeryListEntry";
import {
  QUICK_MENU_ROUTE_BY_LABEL,
  type QuickMenuCategoryLabel,
} from "@/components/domain/home/quickMenuCategories";
const sections: CommunitySectionItem[] = [
  {
    title: "자유 게시판",
    contentType: "postList",
    sectionHeight: 214,
    postItems: [...BBANGTEO_HOME_FREE_POST_ITEMS],
  },
  {
    title: "빵빵 소식",
    contentType: "postList",
    sectionHeight: 214,
    postItems: [...BBANGTEO_HOME_NEWS_POST_ITEMS],
  },
];

const BbangteoPage = () => {
  const navigate = useNavigate();
  const [curationDisplayedBakeryIds, setCurationDisplayedBakeryIds] = useState<number[]>([]);

  const goToBakeryList = () => {
    navigate({
      to: "/bbangteo-bakery-list",
      search: buildBbangteoBakeryListSearch({
        from: "bbangteo",
        curationPins: curationDisplayedBakeryIds,
      }),
    });
  };
  const goToBoardList = () => {
    navigate({ to: "/bbangteo-board" });
  };
  const goToArticleBoardList = () => {
    navigate({ to: "/bbangteo-article-board" });
  };
  const handleCategoryClick = (label: QuickMenuCategoryLabel) => {
    navigate({ to: QUICK_MENU_ROUTE_BY_LABEL[label] });
  };

  return (
    <MobileFrame className="bg-[#f3f4f5]">
      <div className="flex min-h-screen flex-1 flex-col bg-[#f3f4f5]">
        <BbangteoHeader title="빵터" />

        <main className="flex flex-1 flex-col gap-[10px] pb-[114px] sm:pb-[118px]">
          <BbangteoSearchSection onCategoryClick={handleCategoryClick} />
          <TrendHotBreadsSection compact />
          <TrendCurationSection
            compact
            title="요즘 핫한 빵집"
            randomTopKeywordCount={5}
            bakeryListEntryFrom="bbangteo"
            onMoreClick={goToBakeryList}
            onDisplayedBakeryIdsChange={setCurationDisplayedBakeryIds}
          />
          {sections.map((section) => (
            <BbangteoCommunitySection
              key={section.title}
              section={section}
              topContent={
                section.title === "자유 게시판" ? <BbangteoBakerySuggestBanner /> : undefined
              }
              onSectionTitleAreaClick={
                section.title === "빵빵 소식" ? goToArticleBoardList : undefined
              }
              onMoreClick={
                section.title === "자유 게시판"
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
