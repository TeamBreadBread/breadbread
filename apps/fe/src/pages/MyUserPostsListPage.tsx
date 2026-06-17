import { useCallback, useEffect, useState } from "react";
import type { PostSummary } from "@/api/posts";
import { getErrorMessage } from "@/api/types/common";
import { getLikedPosts, getMyPosts, type PaginationParams } from "@/api/user";
import { AppTopBar } from "@/components/common";
import BottomNav from "@/components/layout/BottomNav";
import MobileFrame from "@/components/layout/MobileFrame";
import { formatShortListDate } from "@/utils/formatSeoulDateTime";
import { postDetailRoute, postTypeLabel } from "@/utils/postDetailRoute";
import { useNavigate } from "@tanstack/react-router";
import currationBreadImg from "@/assets/images/Curration_CardBread.png";

const PAGE_SIZE = 10;

type MyUserPostsListVariant = "mine" | "liked";

const PAGE_COPY: Record<
  MyUserPostsListVariant,
  {
    title: string;
    loading: string;
    empty: string;
    fetch: (params: PaginationParams) => ReturnType<typeof getMyPosts>;
  }
> = {
  mine: {
    title: "내가 쓴 게시글",
    loading: "게시글을 불러오는 중이에요.",
    empty: "아직 작성한 게시글이 없어요.",
    fetch: getMyPosts,
  },
  liked: {
    title: "좋아요한 게시글",
    loading: "게시글을 불러오는 중이에요.",
    empty: "아직 좋아요한 게시글이 없어요.",
    fetch: getLikedPosts,
  },
};

type MyUserPostsListPageProps = {
  variant: MyUserPostsListVariant;
};

function PostListCard({ post, onClick }: { post: PostSummary; onClick: () => void }) {
  const hasThumb = Boolean(post.thumbnailImageUrl);

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-start gap-x3 rounded-r4 bg-white px-x5 py-x5 text-left"
    >
      {hasThumb ? (
        <div className="h-[72px] w-[72px] shrink-0 overflow-hidden rounded-[6px] bg-[#f7f8f9]">
          <img
            src={post.thumbnailImageUrl ?? ""}
            alt=""
            className="h-full w-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = currationBreadImg;
              (e.target as HTMLImageElement).className =
                "h-[23px] w-[24px] object-contain opacity-70 mx-auto mt-[24px]";
            }}
          />
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col gap-x2">
        <span className="typo-t3medium text-orange-600">{postTypeLabel(post.postType)}</span>
        <p className="line-clamp-2 typo-t4bold text-gray-1000">{post.title}</p>
        <div className="flex items-center justify-between gap-x2">
          <p className="typo-t3regular text-gray-700">
            좋아요 {post.likeCount} · 댓글 {post.commentCount}
          </p>
          <time className="shrink-0 typo-t3regular text-gray-700">
            {formatShortListDate(post.createdAt)}
          </time>
        </div>
      </div>
    </button>
  );
}

export default function MyUserPostsListPage({ variant }: MyUserPostsListPageProps) {
  const navigate = useNavigate();
  const copy = PAGE_COPY[variant];
  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const loadPage = useCallback(
    async (nextPage: number, append: boolean) => {
      try {
        setError("");
        if (append) {
          setIsLoadingMore(true);
        } else {
          setIsLoading(true);
        }
        const data = await copy.fetch({ page: nextPage, size: PAGE_SIZE });
        setPosts((prev) => (append ? [...prev, ...data.posts] : data.posts));
        setPage(data.page);
        setHasNext(data.hasNext);
      } catch (loadError) {
        setError(getErrorMessage(loadError));
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [copy],
  );

  useEffect(() => {
    void loadPage(0, false);
  }, [loadPage]);

  return (
    <MobileFrame>
      <div className="flex flex-1 flex-col bg-[#f3f4f5]">
        <AppTopBar
          title={copy.title}
          centered
          showBackButton
          onBackClick={() => navigate({ to: "/my" })}
        />

        <main className="flex flex-1 flex-col gap-x4 px-x5 py-x6 pb-[calc(56px+24px)] sm:pb-[calc(72px+24px)]">
          {isLoading ? <p className="typo-t4regular text-gray-700">{copy.loading}</p> : null}
          {error ? (
            <p className="typo-t4regular text-[color:var(--color-red-700)]">{error}</p>
          ) : null}
          {!isLoading && !error && posts.length === 0 ? (
            <div className="rounded-r4 bg-white px-x5 py-x6">
              <p className="typo-t4medium text-gray-1000">{copy.empty}</p>
            </div>
          ) : null}

          {posts.map((post) => (
            <PostListCard
              key={post.id}
              post={post}
              onClick={() => navigate(postDetailRoute(post))}
            />
          ))}

          {hasNext ? (
            <button
              type="button"
              className="rounded-r3 border border-gray-300 bg-white px-x5 py-x4 typo-t4bold text-gray-1000 disabled:opacity-50"
              disabled={isLoadingMore}
              onClick={() => void loadPage(page + 1, true)}
            >
              {isLoadingMore ? "불러오는 중…" : "더 보기"}
            </button>
          ) : null}
        </main>
      </div>

      <BottomNav />
    </MobileFrame>
  );
}
