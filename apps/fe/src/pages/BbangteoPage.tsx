import BbangteoBakerySuggestBanner from "@/components/domain/bbangteo/BbangteoBakerySuggestBanner";
import BbangteoCommunitySection from "@/components/domain/bbangteo/BbangteoCommunitySection";
import BbangteoHeader from "@/components/domain/bbangteo/BbangteoHeader";
import BbangteoSearchSection from "@/components/domain/bbangteo/BbangteoSearchSection";
import TrendHotBreadsSection from "@/components/domain/trend/TrendHotBreadsSection";
import TrendCurationSection from "@/components/domain/trend/TrendCurationSection";
import BottomNav from "@/components/layout/BottomNav";
import type { CommunitySectionItem } from "@/components/domain/bbangteo/types";
import MobileFrame from "@/components/layout/MobileFrame";
import { getPosts } from "@/api/posts";
import {
  BBANGTEO_HOME_FREE_POST_ITEMS,
  BBANGTEO_HOME_NEWS_POST_ITEMS,
} from "@/data/bbangteoCommunityMocks";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { buildBbangteoBakeryListSearch } from "@/utils/bakeryListEntry";
import { formatShortListDate } from "@/utils/formatSeoulDateTime";
import {
  QUICK_MENU_ROUTE_BY_LABEL,
  type QuickMenuCategoryLabel,
} from "@/components/domain/home/quickMenuCategories";

const BbangteoPage = () => {
  const navigate = useNavigate();
  const [curationDisplayedBakeryIds, setCurationDisplayedBakeryIds] = useState<number[]>([]);
  type FreePostPreview = NonNullable<CommunitySectionItem["postItems"]>[number];

  const [freePostItems, setFreePostItems] = useState<FreePostPreview[]>([
    ...BBANGTEO_HOME_FREE_POST_ITEMS,
  ]);

  useEffect(() => {
    let cancelled = false;
    void getPosts({ postTypes: ["FREE"], page: 0, size: 5, sort: "LATEST" })
      .then((response) => {
        if (cancelled || response.posts.length === 0) return;
        setFreePostItems(
          response.posts.map((post) => ({
            id: post.id,
            content: post.title,
            date: formatShortListDate(post.createdAt),
          })),
        );
      })
      .catch(() => {
        /* API 실패 시 목 데이터 유지 */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const sections: CommunitySectionItem[] = useMemo(
    () => [
      {
        title: "자유 게시판",
        contentType: "postList",
        sectionHeight: 214,
        postItems: freePostItems,
      },
      {
        title: "빵빵 소식",
        contentType: "postList",
        sectionHeight: 214,
        postItems: [...BBANGTEO_HOME_NEWS_POST_ITEMS],
      },
    ],
    [freePostItems],
  );

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
  const goToFreePostDetail = (postId: number) => {
    navigate({ to: "/bbangteo-board-post-detail", search: { id: postId } });
  };
  const handleCategoryClick = (label: QuickMenuCategoryLabel) => {
    navigate({ to: QUICK_MENU_ROUTE_BY_LABEL[label] });
  };
  const handleBakerySearch = (keyword: string) => {
    navigate({
      to: "/bbangteo-bakery-list",
      search: buildBbangteoBakeryListSearch({ from: "bbangteo", keyword }),
    });
  };

  return (
    <MobileFrame className="bg-[#f3f4f5]">
      <div className="flex min-h-screen flex-1 flex-col bg-[#f3f4f5]">
        <BbangteoHeader title="빵터" />

        <main className="flex flex-1 flex-col gap-[10px] pb-[114px] sm:pb-[118px]">
          <BbangteoSearchSection
            onCategoryClick={handleCategoryClick}
            onSearch={handleBakerySearch}
          />
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
              onPostItemClick={(post) => {
                if (section.title === "자유 게시판" && post.id) {
                  goToFreePostDetail(post.id);
                  return;
                }
                if (section.title === "자유 게시판") {
                  goToBoardList();
                  return;
                }
                goToArticleBoardList();
              }}
            />
          ))}
        </main>
      </div>

      <BottomNav />
    </MobileFrame>
  );
};

export default BbangteoPage;
