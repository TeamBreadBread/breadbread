import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import ArrowLeft from "@/assets/icons/ArrowLeft.svg";
import currationBreadImg from "@/assets/images/Curration_CardBread.png";
import BottomNav from "@/components/layout/BottomNav";
import MobileFrame from "@/components/layout/MobileFrame";

const tabs = ["자유 게시판", "빵티클"] as const;

type TabType = (typeof tabs)[number];

type Post = {
  id: number;
  title: string;
  image?: string;
  likeCount: number;
  commentCount: number;
  date: string;
  type: TabType;
};

const posts: Post[] = [
  {
    id: 1,
    type: "자유 게시판",
    title: "방금 갓 나온 베이글 먹었는데 진짜 대박",
    image: "Frame 473587_3811.png",
    likeCount: 11,
    commentCount: 11,
    date: "26.04.27",
  },
  {
    id: 2,
    type: "자유 게시판",
    title: "방금 갓 나온 베이글 먹었는데 진짜 대박 지금까지 이런 맛은 없었다",
    image: "Frame 473587_3825.png",
    likeCount: 11,
    commentCount: 11,
    date: "26.04.27",
  },
  {
    id: 3,
    type: "자유 게시판",
    title: "방금 갓 나온 베이글 먹었는데 진짜 대박",
    likeCount: 11,
    commentCount: 11,
    date: "26.04.27",
  },
  {
    id: 4,
    type: "자유 게시판",
    title:
      "연남동 근처에 카공하기 좋은 베이커리 카페 추천 좀! 적당히 조용한 곳 어디 없나 ㅠㅠ 친구랑 적당히 소근소근 얘기할 정도?",
    likeCount: 11,
    commentCount: 11,
    date: "26.04.27",
  },
  {
    id: 5,
    type: "자유 게시판",
    title: "방금 갓 나온 베이글 먹었는데 진짜 대박",
    image: "Frame 473587_3863.png",
    likeCount: 11,
    commentCount: 11,
    date: "26.04.27",
  },
  {
    id: 6,
    type: "자유 게시판",
    title: "방금 갓 나온 베이글 먹었는데 진짜 대박 지금까지 이런 맛은 없었다",
    image: "Frame 473587_3877.png",
    likeCount: 11,
    commentCount: 11,
    date: "26.04.27",
  },
  {
    id: 7,
    type: "자유 게시판",
    title: "방금 갓 나온 베이글 먹었는데 진짜 대박",
    likeCount: 11,
    commentCount: 11,
    date: "26.04.27",
  },
  {
    id: 8,
    type: "자유 게시판",
    title:
      "연남동 근처에 카공하기 좋은 베이커리 카페 추천 좀! 적당히 조용한 곳 어디 없나 ㅠㅠ 친구랑 적당히 소근소근 얘기할 정도?",
    likeCount: 11,
    commentCount: 11,
    date: "26.04.27",
  },
  {
    id: 9,
    type: "빵티클",
    title: "[공지] 이번 주 정기 점검 안내",
    image: "Frame 473587_3811.png",
    likeCount: 11,
    commentCount: 11,
    date: "26.04.27",
  },
  {
    id: 10,
    type: "빵티클",
    title: "[빵티클] 대전 성심당 정복 가이드",
    image: "Frame 473587_3825.png",
    likeCount: 11,
    commentCount: 11,
    date: "26.04.27",
  },
  {
    id: 11,
    type: "빵티클",
    title: "빵터 업데이트: 이제 내 주변 빵집을 지도로 확인하세요!",
    likeCount: 11,
    commentCount: 11,
    date: "26.04.27",
  },
  {
    id: 12,
    type: "빵티클",
    title: '[빵티클] "죽기 전에 꼭 먹어야 할" 전국 5대 크루아상 성지',
    image: "Frame 473587_3863.png",
    likeCount: 11,
    commentCount: 11,
    date: "26.04.27",
  },
  {
    id: 13,
    type: "빵티클",
    title: "[빵티클] 소금빵 열풍의 원조를 찾아서: 시오빵의 탄생 비화",
    image: "Frame 473587_3877.png",
    likeCount: 11,
    commentCount: 11,
    date: "26.04.27",
  },
  {
    id: 14,
    type: "빵티클",
    title: "[공지] 5월 가정의 달 기념 '빵 선물 세트' 이벤트 당첨자 발표",
    image: "Frame 473587_3811.png",
    likeCount: 11,
    commentCount: 11,
    date: "26.04.27",
  },
  {
    id: 15,
    type: "빵티클",
    title: "[공지] 빵순빵돌 1기 서포터즈 모집 시작! (혜택 확인)",
    likeCount: 11,
    commentCount: 11,
    date: "26.04.27",
  },
  {
    id: 16,
    type: "빵티클",
    title: "[빵티클] 빵순이 에디터가 선정한 '실패 없는' 도쿄 빵지순례 코스",
    likeCount: 11,
    commentCount: 11,
    date: "26.04.27",
  },
];

const BackHeader = () => {
  const navigate = useNavigate();
  return (
    <header className="fixed top-0 left-1/2 z-40 flex h-[56px] w-full max-w-[402px] -translate-x-1/2 items-center justify-between border-b border-[#eeeff1] bg-white px-[20px] md:max-w-[744px]">
      <button
        type="button"
        className="flex h-[36px] w-[36px] items-center justify-center"
        onClick={() => navigate({ to: "/bbangteo" })}
      >
        <img src={ArrowLeft} alt="뒤로가기" className="h-[24px] w-[24px]" />
      </button>
      <div className="h-[36px] w-[36px] shrink-0" />
    </header>
  );
};

const BoardTabs = ({
  activeTab,
  onChange,
}: {
  activeTab: TabType;
  onChange: (tab: TabType) => void;
}) => {
  return (
    <div className="flex items-center justify-between border-b border-[#eeeff1] bg-white">
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onChange(tab)}
          className={`h-[56px] flex-1 shrink-0 border-b px-[64px] py-[8px] ${
            activeTab === tab ? "border-[#1a1c20]" : "border-gray-500"
          }`}
        >
          <span
            className={`text-[15px] leading-[20px] text-[#2a3038] ${activeTab === tab ? "font-bold" : "font-medium"}`}
          >
            {tab}
          </span>
        </button>
      ))}
    </div>
  );
};

const PostMetaItem = ({ count }: { count: number }) => (
  <div className="flex items-center gap-[4px]">
    <div className="h-[14px] w-[14px] rounded-full bg-[#dcdee3]" />
    <span className="text-[12px] leading-[16px] text-[#868b94]">{count}</span>
  </div>
);

const PostItem = ({ post }: { post: Post }) => {
  return (
    <article
      className={`flex items-start border-b border-[#f3f4f5] py-[16px] ${post.image ? "gap-[12px]" : "gap-0"}`}
    >
      {post.image ? (
        <div
          className="flex basis-[84px] flex-none items-center justify-center rounded-[6px]"
          style={{
            width: 84,
            height: 84,
            backgroundColor: "#f7f8f9",
            boxShadow: "inset 0 0 0 1px #f3f4f5",
          }}
        >
          <div
            className="flex items-center justify-center overflow-hidden"
            style={{ width: 24, height: 23 }}
          >
            <img
              src={currationBreadImg}
              alt="게시글 이미지 미리보기"
              className="h-full w-full object-contain opacity-70"
            />
          </div>
        </div>
      ) : null}

      <div
        className={`flex flex-1 flex-col justify-between ${post.image ? "min-h-[84px]" : "gap-[10px]"}`}
      >
        <h2 className="line-clamp-2 text-[16px] leading-[22px] text-[#1a1c20]">{post.title}</h2>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-[8px]">
            <PostMetaItem count={post.likeCount} />
            <PostMetaItem count={post.commentCount} />
          </div>
          <time className="text-[12px] leading-[16px] text-[#868b94]">{post.date}</time>
        </div>
      </div>
    </article>
  );
};

const PostList = ({ items }: { items: Post[] }) => {
  return (
    <section className="flex flex-col bg-white px-[20px]">
      {items.map((post) => (
        <PostItem key={post.id} post={post} />
      ))}
    </section>
  );
};

const FloatingWriteButton = () => {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] mx-auto w-full max-w-[744px]">
      <button
        type="button"
        aria-label="글쓰기"
        className="pointer-events-auto fixed right-[20px] bottom-[76px] z-[60] flex h-[56px] w-[56px] items-center justify-center rounded-full bg-gray-800 shadow-[0_4px_12px_rgba(0,0,0,0.18)] sm:bottom-[80px] md:right-[calc((100vw-744px)/2+20px)]"
      >
        <div className="relative h-[24px] w-[24px]">
          <div className="absolute left-[3px] top-[4px] h-[14px] w-[18px] rounded-[3px] border border-white" />
          <div className="absolute left-[9px] top-[1px] h-[6px] w-[6px] rounded-full bg-white" />
          <div className="absolute left-[18px] top-[16px] h-[2px] w-[8px] -rotate-45 rounded-full bg-white" />
        </div>
      </button>
    </div>
  );
};

type BbangteoBoardPageProps = {
  initialTab?: TabType;
};

const BbangteoBoardPage = ({ initialTab = "자유 게시판" }: BbangteoBoardPageProps) => {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const filteredPosts = posts.filter((post) => post.type === activeTab);

  return (
    <MobileFrame className="bg-[#f3f4f5]">
      <div className="flex min-h-screen flex-1 flex-col overflow-x-hidden bg-white">
        <BackHeader />
        <main className="flex flex-1 flex-col pt-[56px] pb-[56px] sm:pb-[60px]">
          <BoardTabs activeTab={activeTab} onChange={setActiveTab} />
          <PostList items={filteredPosts} />
          <div className="h-[90px] shrink-0 bg-gray-200" />
        </main>
      </div>

      {activeTab === "자유 게시판" ? <FloatingWriteButton /> : null}
      <BottomNav />
    </MobileFrame>
  );
};

export default BbangteoBoardPage;
