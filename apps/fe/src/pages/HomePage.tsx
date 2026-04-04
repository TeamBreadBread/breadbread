import { AppShell } from "@/components/layout";
import { CurationSection, QuickMenu } from "@/components/domain/home";
import type { CurationCardData } from "@/components/domain/home";
import type { QuickMenuItem } from "@/components/domain/home";

// TODO: mock 데이터 → API 연동
const curatedBakeries: CurationCardData[] = [
  { id: "bakery-1", title: "밀도 성수점", description: "소금빵 맛집", tag: "인기" },
  { id: "bakery-2", title: "오월의 종", description: "크루아상 전문" },
  { id: "bakery-3", title: "브레드이발소", description: "우유식빵", tag: "신규" },
  { id: "bakery-4", title: "앤트러사이트", description: "빈티지 카페 베이커리" },
];

const curatedCourses: CurationCardData[] = [
  { id: "course-1", title: "강남 빵지순례 코스", description: "3개 베이커리 · 2.4km", tag: "추천" },
  { id: "course-2", title: "홍대 소금빵 투어", description: "4개 베이커리 · 1.8km" },
  { id: "course-3", title: "성수 카페 빵 코스", description: "5개 베이커리 · 3.1km", tag: "인기" },
];

// TODO: 각 항목 onClick → 라우트 연결
const quickMenuItems: QuickMenuItem[] = [
  { id: "ai-course", label: "AI 코스", icon: "🤖" },
  { id: "nearby", label: "내 주변", icon: "📍" },
  { id: "ranking", label: "랭킹", icon: "🏆" },
  { id: "bookmark", label: "즐겨찾기", icon: "🔖" },
];

const HomePage = () => {
  return (
    <AppShell activePath="/">
      <div className="flex flex-col gap-x8 py-x6">
        <QuickMenu items={quickMenuItems} />

        <CurationSection
          title="오늘의 베이커리"
          items={curatedBakeries}
          onMoreClick={() => {
            // TODO: "큐레이션 더보기" 라우트 연결
          }}
        />

        <CurationSection
          title="추천 빵지순례 코스"
          items={curatedCourses}
          onMoreClick={() => {
            // TODO: "큐레이션 더보기" 라우트 연결
          }}
        />
      </div>
    </AppShell>
  );
};

export default HomePage;
