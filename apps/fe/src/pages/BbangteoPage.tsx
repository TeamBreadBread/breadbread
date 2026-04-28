import BbangteoCommunitySection from "@/components/domain/bbangteo/BbangteoCommunitySection";
import BbangteoHeader from "@/components/domain/bbangteo/BbangteoHeader";
import BbangteoSearchSection from "@/components/domain/bbangteo/BbangteoSearchSection";
import BottomNav from "@/components/layout/BottomNav";
import type { CommunitySectionItem } from "@/components/domain/bbangteo/types";
import MobileFrame from "@/components/layout/MobileFrame";
import { useNavigate } from "@tanstack/react-router";

const sections: CommunitySectionItem[] = [
  {
    title: "큐레이션 문구",
    sectionHeight: 300,
    contentType: "curationCards",
    curationItems: [
      { title: "빵집 이름 1", address: "소제동", rate: 4.5 },
      { title: "빵집 이름 2", address: "소제동", rate: 4.8 },
      { title: "빵집 이름 3", address: "은행동", rate: 4.2 },
      { title: "빵집 이름 4", address: "대흥동", rate: 4.9 },
    ],
  },
  {
    title: "자유 게시판",
    contentType: "postList",
    sectionHeight: 214,
    postItems: [
      { content: "방금 갓 나온 베이글 먹었는데 진짜 대박", date: "26.04.27" },
      { content: "빵순이가 알려주는 주말 성심당 웨이팅 꿀팁.txt", date: "26.04.27" },
      { content: "빵 보관 어떻게들 하세요? 냉동 vs 냉장", date: "26.04.27" },
      { content: "다이어트 중인데 빵 못 참겠어요.. 정상이겠죠?", date: "26.04.27" },
      { content: "연남동 근처에 카공하기 좋은 베이커리 카페 추천 좀!", date: "26.04.27" },
    ],
  },
  {
    title: "빵빵 소식",
    contentType: "postList",
    sectionHeight: 214,
    postItems: [
      { content: "[공지] 이번 주 정기 점검 안내", date: "26.04.27" },
      { content: "[빵티클] 대전 성심당 정복 가이드", date: "26.04.27" },
      { content: "[공지] 이번 주 정기 점검 안내", date: "26.04.27" },
      { content: "[빵티클] 대전 성심당 정복 가이드", date: "26.04.27" },
      { content: "[공지] 이번 주 정기 점검 안내", date: "26.04.27" },
    ],
  },
];

const BbangteoPage = () => {
  const navigate = useNavigate();

  const goToBakeryList = () => {
    navigate({ to: "/bbangteo-bakery-list" });
  };
  const goToBoardList = () => {
    navigate({ to: "/bbangteo-board" });
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

        <main className="flex flex-1 flex-col gap-[10px] pt-[56px] pb-[114px] sm:pb-[118px]">
          <BbangteoSearchSection onCategoryClick={handleCategoryClick} />
          {sections.map((section) => (
            <BbangteoCommunitySection
              key={section.title}
              section={section}
              onMoreClick={
                section.title === "큐레이션 문구"
                  ? goToBakeryList
                  : section.title === "자유 게시판"
                    ? goToBoardList
                    : section.title === "빵빵 소식"
                      ? goToArticleBoardList
                      : undefined
              }
              onCurationCardClick={section.title === "큐레이션 문구" ? goToBakeryList : undefined}
              onPostItemClick={
                section.title === "자유 게시판"
                  ? goToBoardList
                  : section.title === "빵빵 소식"
                    ? goToArticleBoardList
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
