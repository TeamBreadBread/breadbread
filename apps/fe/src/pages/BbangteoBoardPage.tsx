import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useNavigate } from "@tanstack/react-router";
import ArrowLeft from "@/assets/icons/ArrowLeft.svg";
import currationBreadImg from "@/assets/images/Curration_CardBread.png";
import { getPosts, type PostSummary, type PostType } from "@/api/posts";
import {
  type BbangteoBoardListRow,
  getMockBoardSource,
  shouldUseBoardMock,
} from "@/data/bbangteoBoardMock";
import { getErrorMessage } from "@/api/types/common";
import {
  clearBoardPostLikeOverridesForPostIds,
  getBoardPostLikeOverridesSnapshot,
  subscribeBoardPostLikeOverrides,
} from "@/state/boardPostLikeOverrides";
import {
  getUserCreatedFreePostsRevision,
  getUserCreatedFreePostsSnapshot,
  subscribeUserCreatedFreePosts,
} from "@/state/boardUserCreatedFreePosts";
import BottomNav from "@/components/layout/BottomNav";
import {
  BBANGTEO_FIXED_HEADER_OUTER_CLASS,
  FIXED_TOP_BAR_SPACER_CLASS,
} from "@/components/layout/layout.constants";
import MobileFrame from "@/components/layout/MobileFrame";

const tabs = ["자유 게시판", "빵티클"] as const;

type TabType = (typeof tabs)[number];

type BoardListItem = BbangteoBoardListRow;

function postTypesForTab(tab: TabType): PostType[] {
  return tab === "자유 게시판" ? ["FREE"] : ["NOTICE", "ARTICLE"];
}

function mapSummaryToItem(post: PostSummary): BoardListItem {
  const d = new Date(post.createdAt);
  const dateLabel = Number.isNaN(d.getTime())
    ? ""
    : `${String(d.getFullYear()).slice(-2)}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;

  return {
    id: post.id,
    title: post.title,
    thumbnailImageUrl: post.thumbnailImageUrl,
    likeCount: post.likeCount,
    commentCount: post.commentCount,
    dateLabel,
    postType: post.postType,
    createdAt: post.createdAt,
  };
}

function compareBoardPostsNewestFirst(a: BoardListItem, b: BoardListItem): number {
  const ta = a.createdAt ? Date.parse(a.createdAt) : NaN;
  const tb = b.createdAt ? Date.parse(b.createdAt) : NaN;
  if (Number.isFinite(ta) && Number.isFinite(tb) && tb !== ta) {
    return tb - ta;
  }
  return b.id - a.id;
}

/** mock 자유 게시판: 작성한 실제 글을 목록 최상단에 두고 나머지는 기존 mock */
function getMergedMockFreeBoardSource(): BoardListItem[] {
  const userPosts = [...getUserCreatedFreePostsSnapshot()];
  const ids = new Set(userPosts.map((u) => u.id));
  return [...userPosts, ...getMockBoardSource("자유 게시판").filter((m) => !ids.has(m.id))];
}

function getMockListSource(tab: TabType): BoardListItem[] {
  return tab === "자유 게시판" ? getMergedMockFreeBoardSource() : getMockBoardSource(tab);
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

/** 자유 게시판: 좋아요(하트) → 댓글(말풍선) */
const IconHeartOutline = () => (
  <svg
    className="shrink-0"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden
  >
    <path
      d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconSpeechBubbleOutline = () => (
  <svg
    className="shrink-0"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden
  >
    <path
      d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const BoardFreeMetaRow = ({
  likeCount,
  commentCount,
}: {
  likeCount: number;
  commentCount: number;
}) => (
  <div className="flex items-center gap-[10px] text-[#868b94]">
    <span className="flex items-center gap-[4px]" title={`좋아요 ${likeCount}`}>
      <IconHeartOutline />
      <span className="text-[12px] leading-[16px]">{likeCount}</span>
    </span>
    <span className="flex items-center gap-[4px]" title={`댓글 ${commentCount}`}>
      <IconSpeechBubbleOutline />
      <span className="text-[12px] leading-[16px]">{commentCount}</span>
    </span>
  </div>
);

/** 빵티클(공지): 좋아요만 — 댓글 없음 */
const BoardBbangticleMetaRow = ({ likeCount }: { likeCount: number }) => (
  <div className="flex items-center gap-[10px] text-[#868b94]">
    <span className="flex items-center gap-[4px]" title={`좋아요 ${likeCount}`}>
      <IconHeartOutline />
      <span className="text-[12px] leading-[16px]">{likeCount}</span>
    </span>
  </div>
);

const ThumbnailFallback = () => (
  <div
    className="flex items-center justify-center overflow-hidden"
    style={{ width: 24, height: 23 }}
  >
    <img src={currationBreadImg} alt="" className="h-full w-full object-contain opacity-70" />
  </div>
);

const PostThumbnail = ({
  thumbnailImageUrl,
  title,
}: {
  thumbnailImageUrl: string | null;
  title: string;
}) => {
  const [broken, setBroken] = useState(false);

  if (!thumbnailImageUrl || broken) {
    return (
      <div
        className="flex basis-[84px] flex-none items-center justify-center rounded-[6px]"
        style={{
          width: 84,
          height: 84,
          backgroundColor: "#f7f8f9",
          boxShadow: "inset 0 0 0 1px #f3f4f5",
        }}
      >
        <ThumbnailFallback />
      </div>
    );
  }

  return (
    <div
      className="relative flex basis-[84px] flex-none shrink-0 overflow-hidden rounded-[6px]"
      style={{
        width: 84,
        height: 84,
        boxShadow: "inset 0 0 0 1px #f3f4f5",
      }}
    >
      <img
        src={thumbnailImageUrl}
        alt={`${title} 썸네일`}
        className="h-full w-full object-cover"
        loading="lazy"
        onError={() => setBroken(true)}
      />
    </div>
  );
};

type BoardListVariant = "free" | "bbangticle";

const PostItem = ({
  post,
  onClick,
  variant,
}: {
  post: BoardListItem;
  onClick?: () => void;
  variant: BoardListVariant;
}) => {
  const hasThumb = Boolean(post.thumbnailImageUrl);

  return (
    <article
      className={`flex items-start border-b border-[#f3f4f5] py-[16px] ${hasThumb ? "gap-[12px]" : "gap-0"}`}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick?.();
        }
      }}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {hasThumb ? (
        <PostThumbnail thumbnailImageUrl={post.thumbnailImageUrl} title={post.title} />
      ) : null}

      <div
        className={`flex flex-1 flex-col justify-between ${hasThumb ? "min-h-[84px]" : "gap-[10px]"}`}
      >
        <h2 className="line-clamp-2 text-[16px] leading-[22px] text-[#1a1c20]">{post.title}</h2>
        <div className="flex items-center justify-between">
          {variant === "free" ? (
            <BoardFreeMetaRow likeCount={post.likeCount} commentCount={post.commentCount} />
          ) : (
            <BoardBbangticleMetaRow likeCount={post.likeCount} />
          )}
          <time className="text-[12px] leading-[16px] text-[#868b94]">{post.dateLabel}</time>
        </div>
      </div>
    </article>
  );
};

const PostList = ({
  items,
  onPostClick,
  variant,
}: {
  items: BoardListItem[];
  onPostClick?: (post: BoardListItem) => void;
  variant: BoardListVariant;
}) => {
  return (
    <section className="flex flex-col bg-white px-[20px]">
      {items.map((post) => (
        <PostItem
          key={post.id}
          post={post}
          variant={variant}
          onClick={onPostClick ? () => onPostClick(post) : undefined}
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
  /** `/bbangteo-board?listRefresh=` — 글 작성 후 목록 강제 재조회 */
  listRefresh?: number;
};

const PAGE_SIZE = 10;

const BbangteoBoardPage = ({ initialTab = "자유 게시판", listRefresh }: BbangteoBoardPageProps) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [items, setItems] = useState<BoardListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const refreshFirstPage = useCallback(async () => {
    setLoading(true);
    setListError(null);
    setItems([]);

    if (shouldUseBoardMock()) {
      const source = getMockListSource(activeTab);
      setItems(source.slice(0, PAGE_SIZE));
      setPage(0);
      setHasNext(source.length > PAGE_SIZE);
      setLoading(false);
      return;
    }

    try {
      const res = await getPosts({
        postTypes: postTypesForTab(activeTab),
        page: 0,
        size: PAGE_SIZE,
      });
      clearBoardPostLikeOverridesForPostIds(res.posts.map((p) => p.id));
      setItems(res.posts.map(mapSummaryToItem));
      setPage(res.page);
      setHasNext(res.hasNext);
    } catch (e) {
      setListError(getErrorMessage(e));
      setItems([]);
      setHasNext(false);
      setPage(0);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  const userCreatedFreeRevision = useSyncExternalStore(
    subscribeUserCreatedFreePosts,
    getUserCreatedFreePostsRevision,
    () => 0,
  );

  useEffect(() => {
    void refreshFirstPage();
  }, [refreshFirstPage, listRefresh, userCreatedFreeRevision]);

  const likeOverrides = useSyncExternalStore(
    subscribeBoardPostLikeOverrides,
    getBoardPostLikeOverridesSnapshot,
    () => new Map<number, { liked: boolean; likeCount: number }>(),
  );

  const displayItems = useMemo(() => {
    const merged = items.map((p) => ({
      ...p,
      likeCount: likeOverrides.get(p.id)?.likeCount ?? p.likeCount,
    }));
    if (shouldUseBoardMock()) {
      const userIds = new Set(getUserCreatedFreePostsSnapshot().map((r) => r.id));
      merged.sort((a, b) => {
        const aUser = userIds.has(a.id);
        const bUser = userIds.has(b.id);
        if (aUser !== bUser) {
          return aUser ? -1 : 1;
        }
        return compareBoardPostsNewestFirst(a, b);
      });
    } else {
      merged.sort(compareBoardPostsNewestFirst);
    }
    return merged;
  }, [items, likeOverrides]);

  const handlePostClick = (post: BoardListItem) => {
    if (activeTab === "자유 게시판") {
      navigate({
        to: "/bbangteo-board-post-detail",
        search: { postId: post.id, detailRefresh: undefined },
      });
      return;
    }
    navigate({ to: "/bbangteo-bbangticle-post-detail", search: { postId: post.id } });
  };

  const handleLoadMore = async () => {
    if (!hasNext || loadingMore || loading) {
      return;
    }

    if (shouldUseBoardMock()) {
      setLoadingMore(true);
      try {
        const source = getMockListSource(activeTab);
        const next = page + 1;
        const start = next * PAGE_SIZE;
        const slice = source.slice(start, start + PAGE_SIZE);
        setItems((prev) => [...prev, ...slice]);
        setPage(next);
        setHasNext(start + slice.length < source.length);
      } finally {
        setLoadingMore(false);
      }
      return;
    }

    setLoadingMore(true);
    try {
      const next = page + 1;
      const res = await getPosts({
        postTypes: postTypesForTab(activeTab),
        page: next,
        size: PAGE_SIZE,
      });
      clearBoardPostLikeOverridesForPostIds(res.posts.map((p) => p.id));
      setItems((prev) => [...prev, ...res.posts.map(mapSummaryToItem)]);
      setPage(res.page);
      setHasNext(res.hasNext);
    } catch (e) {
      alert(getErrorMessage(e));
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <MobileFrame className="bg-[#f3f4f5]">
      <div className="flex min-h-screen flex-1 flex-col overflow-x-hidden bg-white">
        <BackHeader />
        <main className="flex flex-1 flex-col pb-[56px] sm:pb-[60px]">
          <BoardTabs activeTab={activeTab} onChange={setActiveTab} />
          {listError ? (
            <p className="px-[20px] py-[24px] text-center text-[14px] leading-[20px] text-[#868b94]">
              {listError}
            </p>
          ) : null}
          {!loading && !listError && items.length === 0 ? (
            <p className="px-[20px] py-[24px] text-center text-[14px] leading-[20px] text-[#868b94]">
              게시글이 없습니다.
            </p>
          ) : null}
          {loading ? (
            <p className="px-[20px] py-[24px] text-center text-[14px] text-[#868b94]">
              불러오는 중…
            </p>
          ) : null}
          {!loading ? (
            <PostList
              items={displayItems}
              onPostClick={handlePostClick}
              variant={activeTab === "자유 게시판" ? "free" : "bbangticle"}
            />
          ) : null}
          {hasNext && !loading ? (
            <div className="flex justify-center bg-white px-[20px] py-[16px]">
              <button
                type="button"
                className="rounded-[8px] border border-[#dcdee3] px-[16px] py-[10px] text-[14px] font-medium text-[#4d5159] disabled:opacity-50"
                disabled={loadingMore}
                onClick={() => void handleLoadMore()}
              >
                {loadingMore ? "불러오는 중…" : "더 보기"}
              </button>
            </div>
          ) : null}
          <div className="h-[90px] shrink-0 bg-gray-200" />
        </main>
      </div>

      {activeTab === "자유 게시판" ? (
        <FloatingWriteButton
          onClick={() =>
            navigate({ to: "/bbangteo-board-write", search: { editPostId: undefined } })
          }
        />
      ) : null}
      <BottomNav />
    </MobileFrame>
  );
};

export default BbangteoBoardPage;
