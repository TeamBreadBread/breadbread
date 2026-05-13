import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { getPosts, type PostListSort, type PostSummary, type PostType } from "@/api/posts";
import { getErrorMessage } from "@/api/types/common";
import {
  getMockArticleBoardSummaries,
  getMockFreeBoardSummaries,
} from "@/data/bbangteoCommunityMocks";
import ArrowLeft from "@/assets/icons/ArrowLeft.svg";
import currationBreadImg from "@/assets/images/Curration_CardBread.png";
import BottomNav from "@/components/layout/BottomNav";
import {
  BBANGTEO_FIXED_HEADER_OUTER_CLASS,
  FIXED_TOP_BAR_SPACER_CLASS,
} from "@/components/layout/layout.constants";
import MobileFrame from "@/components/layout/MobileFrame";
import {
  mergePostSummaryWithLikeOverlay,
  reconcileOverlaysWithSummaries,
  subscribePostLikeOverlayChange,
  type PostSummaryWithLikeOverlay,
} from "@/lib/postLikeLocalCache";
import { formatShortListDate } from "@/utils/formatSeoulDateTime";

const tabs = ["자유 게시판", "빵티클"] as const;

const BOARD_SORT_OPTIONS: { value: PostListSort; label: string }[] = [
  { value: "LATEST", label: "최신순" },
  { value: "LIKE_COUNT", label: "좋아요순" },
];

type TabType = (typeof tabs)[number];

function tabToPostTypes(tab: TabType): PostType[] {
  return tab === "자유 게시판" ? ["FREE"] : ["NOTICE", "ARTICLE"];
}

function postDetailPath(
  post: PostSummary,
): "/bbangteo-board-post-detail" | "/bbangteo-bbangticle-post-detail" {
  return post.postType === "FREE"
    ? "/bbangteo-board-post-detail"
    : "/bbangteo-bbangticle-post-detail";
}

const BackHeader = () => {
  const navigate = useNavigate();
  return (
    <>
      <header className={BBANGTEO_FIXED_HEADER_OUTER_CLASS}>
        <div className="flex h-[56px] items-center justify-between px-[20px]">
          <button
            type="button"
            className="flex h-[36px] w-[36px] items-center justify-center"
            onClick={() => navigate({ to: "/bbangteo" })}
          >
            <img src={ArrowLeft} alt="뒤로가기" className="h-[24px] w-[24px]" />
          </button>
          <div className="h-[36px] w-[36px] shrink-0" />
        </div>
      </header>
      <div className={FIXED_TOP_BAR_SPACER_CLASS} aria-hidden />
    </>
  );
};

const BoardSortFilters = ({
  value,
  onChange,
}: {
  value: PostListSort;
  onChange: (sort: PostListSort) => void;
}) => (
  <div className="flex flex-wrap gap-[8px] border-b border-[#eeeff1] bg-white px-[20px] py-[12px]">
    {BOARD_SORT_OPTIONS.map((opt) => (
      <button
        key={opt.value}
        type="button"
        onClick={() => onChange(opt.value)}
        className={`rounded-full px-[14px] py-[8px] text-[13px] transition-colors ${
          value === opt.value
            ? "bg-[#1a1c20] font-semibold text-white"
            : "bg-[#f3f4f5] font-medium text-[#555d6d]"
        }`}
      >
        {opt.label}
      </button>
    ))}
  </div>
);

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

const ListHeartIcon = ({ filled }: { filled?: boolean }) => (
  <svg
    width={14}
    height={14}
    viewBox="0 0 24 24"
    aria-hidden
    className={filled ? "shrink-0 red_700" : "shrink-0 text-[#868b94]"}
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const ListCommentIcon = () => (
  <svg
    width={14}
    height={14}
    viewBox="0 0 24 24"
    aria-hidden
    className="shrink-0 text-[#868b94]"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);

const PostMetaItem = ({
  count,
  variant,
  likeFilled,
}: {
  count: number;
  variant: "like" | "comment";
  likeFilled?: boolean;
}) => (
  <div className="flex items-center gap-[4px]">
    {variant === "like" ? <ListHeartIcon filled={likeFilled} /> : <ListCommentIcon />}
    <span
      className={`text-[12px] leading-[16px] ${
        variant === "like" && likeFilled ? "red_700" : "text-[#868b94]"
      }`}
    >
      {count}
    </span>
  </div>
);

const PostItem = ({
  post,
  showCommentMeta,
  onClick,
}: {
  post: PostSummaryWithLikeOverlay;
  showCommentMeta: boolean;
  onClick?: () => void;
}) => {
  const hasThumb = Boolean(post.thumbnailImageUrl);
  return (
    <article
      className={`flex cursor-pointer items-start border-b border-[#f3f4f5] py-[16px] ${hasThumb ? "gap-[12px]" : "gap-0"}`}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick?.();
        }
      }}
      role="button"
      tabIndex={0}
    >
      {hasThumb ? (
        <div
          className="flex basis-[84px] flex-none items-center justify-center overflow-hidden rounded-[6px]"
          style={{
            width: 84,
            height: 84,
            backgroundColor: "#f7f8f9",
            boxShadow: "inset 0 0 0 1px #f3f4f5",
          }}
        >
          <img
            src={post.thumbnailImageUrl ?? ""}
            alt=""
            className="h-full w-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = currationBreadImg;
              (e.target as HTMLImageElement).className =
                "h-[23px] w-[24px] object-contain opacity-70";
            }}
          />
        </div>
      ) : null}

      <div
        className={`flex flex-1 flex-col justify-between ${hasThumb ? "min-h-[84px]" : "gap-[10px]"}`}
      >
        <h2 className="line-clamp-2 text-[16px] leading-[22px] text-[#1a1c20]">{post.title}</h2>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-[8px]">
            <PostMetaItem count={post.likeCount} variant="like" likeFilled={post.liked} />
            {showCommentMeta ? <PostMetaItem count={post.commentCount} variant="comment" /> : null}
          </div>
          <time className="text-[12px] leading-[16px] text-[#868b94]">
            {formatShortListDate(post.createdAt)}
          </time>
        </div>
      </div>
    </article>
  );
};

const PostList = ({
  items,
  showCommentMeta,
  onPostClick,
}: {
  items: PostSummaryWithLikeOverlay[];
  showCommentMeta: boolean;
  onPostClick: (post: PostSummaryWithLikeOverlay) => void;
}) => {
  return (
    <section className="flex flex-col bg-white px-[20px]">
      {items.map((post) => (
        <PostItem
          key={post.id}
          post={post}
          showCommentMeta={showCommentMeta}
          onClick={() => onPostClick(post)}
        />
      ))}
    </section>
  );
};

const FloatingWriteButton = ({ onClick }: { onClick: () => void }) => {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] mx-auto w-full max-w-[744px]">
      <button
        type="button"
        aria-label="글쓰기"
        onClick={onClick}
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
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [page, setPage] = useState(0);
  const [items, setItems] = useState<PostSummaryWithLikeOverlay[]>([]);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [sortBy, setSortBy] = useState<PostListSort>("LATEST");

  useEffect(() => {
    setActiveTab(initialTab);
    setPage(0);
  }, [initialTab]);

  useEffect(() => {
    return subscribePostLikeOverlayChange(() => {
      setItems((prev) => prev.map(mergePostSummaryWithLikeOverlay));
    });
  }, []);

  useEffect(() => {
    setPage(0);
  }, [sortBy]);

  const onTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);
    setPage(0);
    setSortBy("LATEST");
  }, []);

  useEffect(() => {
    let cancelled = false;
    const postTypes = tabToPostTypes(activeTab);
    const isFirstPage = page === 0;

    void (async () => {
      const mockLead =
        activeTab === "자유 게시판" ? getMockFreeBoardSummaries() : getMockArticleBoardSummaries();
      const sortedMockLead =
        sortBy === "LIKE_COUNT"
          ? [...mockLead].sort((a, b) => b.likeCount - a.likeCount || b.id - a.id)
          : mockLead;
      try {
        if (isFirstPage) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }
        setError("");
        const res = await getPosts({ postTypes, page, size: 10, sort: sortBy });
        if (cancelled) return;
        if (isFirstPage) {
          reconcileOverlaysWithSummaries([...sortedMockLead, ...res.posts], false);
          setItems([...sortedMockLead, ...res.posts].map(mergePostSummaryWithLikeOverlay));
        } else {
          reconcileOverlaysWithSummaries(res.posts, false);
          setItems((prev) => [...prev, ...res.posts.map(mergePostSummaryWithLikeOverlay)]);
        }
        setHasNext(res.hasNext);
      } catch (e) {
        if (!cancelled) {
          if (isFirstPage) {
            setItems(sortedMockLead.map(mergePostSummaryWithLikeOverlay));
            setHasNext(false);
            setError("");
          } else {
            setError(getErrorMessage(e));
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeTab, page, sortBy]);

  const handlePostClick = (post: PostSummaryWithLikeOverlay) => {
    const to = postDetailPath(post);
    navigate({ to, search: { id: post.id } });
  };

  return (
    <MobileFrame className="bg-[#f3f4f5]">
      <div className="flex min-h-screen flex-1 flex-col overflow-x-hidden bg-white">
        <BackHeader />
        <main className="flex flex-1 flex-col pb-[56px] sm:pb-[60px]">
          <BoardTabs activeTab={activeTab} onChange={onTabChange} />
          <BoardSortFilters value={sortBy} onChange={setSortBy} />
          {loading ? <p className="px-[20px] py-[24px] text-[#868b94]">불러오는 중...</p> : null}
          {!loading && error ? <p className="px-[20px] py-[24px] text-[#d32f2f]">{error}</p> : null}
          {!loading && !error && items.length === 0 ? (
            <p className="px-[20px] py-[24px] text-[#868b94]">게시글이 없습니다.</p>
          ) : null}
          {!loading && !error && items.length > 0 ? (
            <PostList
              items={items}
              showCommentMeta={activeTab === "자유 게시판"}
              onPostClick={handlePostClick}
            />
          ) : null}
          {!loading && hasNext ? (
            <div className="flex justify-center bg-white px-[20px] py-[16px]">
              <button
                type="button"
                disabled={loadingMore}
                className="rounded-full border border-[#dcdee3] px-[20px] py-[10px] text-[14px] text-[#1a1c20] disabled:opacity-50"
                onClick={() => setPage((p) => p + 1)}
              >
                {loadingMore ? "불러오는 중..." : "더 보기"}
              </button>
            </div>
          ) : null}
          <div className="h-[90px] shrink-0 bg-gray-200" />
        </main>
      </div>

      {activeTab === "자유 게시판" ? (
        <FloatingWriteButton
          onClick={() => navigate({ to: "/bbangteo-board-write", search: { editId: 0 } })}
        />
      ) : null}
      <BottomNav />
    </MobileFrame>
  );
};

export default BbangteoBoardPage;
