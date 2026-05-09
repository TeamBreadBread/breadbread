import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import ArrowLeft from "@/assets/icons/ArrowLeft.svg";
import currationBreadImg from "@/assets/images/Curration_CardBread.png";
import { getPost, likePost, type PostDetail, unlikePost } from "@/api/posts";
import {
  getMockBbangticleBoardPostDetail,
  isMockBbangticleBoardPostId,
  shouldUseBoardMock,
} from "@/data/bbangteoBoardMock";
import {
  mergeBoardPostEngagementIntoDetail,
  setBoardPostEngagement,
} from "@/state/boardPostLikeOverrides";
import { getErrorMessage } from "@/api/types/common";
import {
  ToolbarHeartLikeIcon,
  ToolbarHamburgerIcon,
} from "@/components/icons/PostDetailToolbarIcons";
import BottomNav from "@/components/layout/BottomNav";
import {
  BBANGTEO_FIXED_HEADER_OUTER_CLASS,
  FIXED_TOP_BAR_SPACER_CLASS,
} from "@/components/layout/layout.constants";
import MobileFrame from "@/components/layout/MobileFrame";

export type BbangticlePostDetailPageProps = {
  postId?: number;
  listPath: "/bbangteo-article-board";
};

/** 빵티클(공지)은 댓글 미노출 — API가 내려줘도 무시 */
function detailWithoutComments(d: PostDetail): PostDetail {
  return {
    ...d,
    commentListResponse: { comments: [], total: 0 },
  };
}

function formatDetailDateParts(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return { date: "", time: "" };
  }
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return {
    date: `${y}.${m}.${day}`,
    time: `${hh}:${mm}`,
  };
}

const Avatar = ({
  nickname,
  profileImageUrl,
  sizeClass = "h-[40px] w-[40px]",
}: {
  nickname: string;
  profileImageUrl: string | null;
  sizeClass?: string;
}) => {
  const [broken, setBroken] = useState(false);

  if (profileImageUrl && !broken) {
    return (
      <img
        src={profileImageUrl}
        alt=""
        className={`${sizeClass} shrink-0 rounded-full border border-[#eeeff1] object-cover`}
        loading="lazy"
        onError={() => setBroken(true)}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} shrink-0 rounded-full border border-[#eeeff1] bg-[#f7f8f9]`}
      aria-label={nickname}
    />
  );
};

const BackHeader = ({ listPath }: { listPath: "/bbangteo-article-board" }) => {
  const navigate = useNavigate();
  return (
    <>
      <header className={BBANGTEO_FIXED_HEADER_OUTER_CLASS}>
        <div className="flex h-[56px] items-center justify-between px-[20px]">
          <button
            type="button"
            className="flex h-[36px] w-[36px] items-center justify-center"
            onClick={() => navigate({ to: listPath })}
          >
            <img src={ArrowLeft} alt="뒤로가기" className="h-[24px] w-[24px]" />
          </button>
          <div className="h-[36px] w-[36px]" />
        </div>
      </header>
      <div className={FIXED_TOP_BAR_SPACER_CLASS} aria-hidden />
    </>
  );
};

const DateTimeText = ({ date, time }: { date: string; time: string }) => (
  <div className="flex items-start gap-[6px]">
    <span className="whitespace-nowrap text-[12px] leading-[16px] text-[#868b94]">{date}</span>
    <span className="whitespace-nowrap text-[12px] leading-[16px] text-[#868b94]">{time}</span>
  </div>
);

const AuthorInfo = ({
  nickname,
  profileImageUrl,
  date,
  time,
}: {
  nickname: string;
  profileImageUrl: string | null;
  date: string;
  time: string;
}) => (
  <div className="flex h-[40px] items-center gap-[10px]">
    <Avatar nickname={nickname} profileImageUrl={profileImageUrl} />
    <div className="flex flex-1 flex-col gap-[2px]">
      <div className="whitespace-nowrap text-[13px] leading-[18px] font-bold text-[#1a1c20]">
        {nickname}
      </div>
      <DateTimeText date={date} time={time} />
    </div>
  </div>
);

const DetailImageThumb = ({ url, index }: { url: string; index: number }) => {
  const [broken, setBroken] = useState(false);

  return (
    <div className="flex h-[110px] w-[110px] shrink-0 items-center justify-center overflow-hidden rounded-[8px] bg-[#f3f4f5]">
      {broken ? (
        <img
          src={currationBreadImg}
          alt={`게시글 이미지 ${index + 1}`}
          className="h-[31px] w-[32px] object-contain"
        />
      ) : (
        <img
          src={url}
          alt={`게시글 이미지 ${index + 1}`}
          className="h-full w-full object-cover"
          loading="lazy"
          onError={() => setBroken(true)}
        />
      )}
    </div>
  );
};

const ImageRow = ({ imageUrls }: { imageUrls: string[] }) => {
  if (!imageUrls.length) {
    return null;
  }

  return (
    <div className="flex h-[110px] items-center gap-[6px] overflow-x-auto">
      {imageUrls.map((url, index) => (
        <DetailImageThumb key={`${url}-${index}`} url={url} index={index} />
      ))}
    </div>
  );
};

const PostActionBar = ({
  listPath,
  liked,
  likeCount,
  liking,
  onToggleLike,
}: {
  listPath: "/bbangteo-article-board";
  liked: boolean;
  likeCount: number;
  liking: boolean;
  onToggleLike: () => void;
}) => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between">
      <button
        type="button"
        className="flex items-center gap-[6px] text-[#1a1c20]"
        onClick={() => navigate({ to: listPath })}
      >
        <ToolbarHamburgerIcon />
        <span className="text-[14px] leading-[19px]">목록으로</span>
      </button>

      <button
        type="button"
        disabled={liking}
        aria-pressed={liked}
        aria-label={`좋아요 ${likeCount.toLocaleString("ko-KR")}`}
        className="flex items-center gap-[6px] text-[#1a1c20] disabled:opacity-50"
        onClick={() => void onToggleLike()}
      >
        <ToolbarHeartLikeIcon liked={liked} />
        <span className="text-[14px] leading-[19px]">{likeCount.toLocaleString("ko-KR")}</span>
      </button>
    </div>
  );
};

const PostDetailSection = ({
  detail,
  listPath,
  liking,
  onToggleLike,
}: {
  detail: PostDetail;
  listPath: "/bbangteo-article-board";
  liking: boolean;
  onToggleLike: () => void;
}) => {
  const { date, time } = formatDetailDateParts(detail.createdAt);
  const urls = detail.imageUrls ?? [];

  return (
    <section className="flex flex-col gap-[24px] bg-white p-[20px]">
      <AuthorInfo
        nickname={detail.nickname}
        profileImageUrl={detail.profileImageUrl}
        date={date}
        time={time}
      />
      <div className="flex flex-col gap-[16px]">
        <div className="flex flex-col gap-[10px]">
          <h1 className="text-[18px] leading-[24px] font-bold text-[#1a1c20]">{detail.title}</h1>
          <p className="whitespace-pre-line text-[16px] leading-[22px] text-[#1a1c20]">
            {detail.content}
          </p>
        </div>
        <ImageRow imageUrls={urls} />
      </div>
      <PostActionBar
        listPath={listPath}
        liked={detail.liked}
        likeCount={detail.likeCount}
        liking={liking}
        onToggleLike={onToggleLike}
      />
    </section>
  );
};

const BbangticlePostDetailPage = ({ postId, listPath }: BbangticlePostDetailPageProps) => {
  const navigate = useNavigate();
  const [detail, setDetail] = useState<PostDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [liking, setLiking] = useState(false);

  useEffect(() => {
    if (postId == null) {
      setLoading(false);
      setLoadError("존재하지 않는 게시글입니다.");
      setDetail(null);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        if (shouldUseBoardMock()) {
          const local = getMockBbangticleBoardPostDetail(postId);
          if (local) {
            if (!cancelled) {
              setDetail(mergeBoardPostEngagementIntoDetail(postId, local));
            }
            return;
          }
        }
        const data = await getPost(postId);
        if (cancelled) return;
        setDetail(mergeBoardPostEngagementIntoDetail(postId, detailWithoutComments(data)));
      } catch (e) {
        if (cancelled) return;
        const fallback = getMockBbangticleBoardPostDetail(postId);
        if (fallback) {
          setDetail(mergeBoardPostEngagementIntoDetail(postId, fallback));
          setLoadError(null);
          return;
        }
        setLoadError(getErrorMessage(e));
        setDetail(null);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [postId]);

  const handleToggleLike = async () => {
    if (postId == null || !detail || liking) {
      return;
    }
    if (isMockBbangticleBoardPostId(postId)) {
      const nextLiked = !detail.liked;
      const nextLikeCount = nextLiked ? detail.likeCount + 1 : Math.max(0, detail.likeCount - 1);
      setBoardPostEngagement(postId, { liked: nextLiked, likeCount: nextLikeCount });
      setLiking(true);
      try {
        setDetail((prev) => {
          if (!prev) {
            return null;
          }
          if (prev.liked) {
            return { ...prev, liked: false, likeCount: Math.max(0, prev.likeCount - 1) };
          }
          return { ...prev, liked: true, likeCount: prev.likeCount + 1 };
        });
      } finally {
        setLiking(false);
      }
      return;
    }
    setLiking(true);
    try {
      const nextUnlikeCount = Math.max(0, detail.likeCount - 1);
      const nextLikeCountAfterLike = detail.likeCount + 1;
      if (detail.liked) {
        await unlikePost(postId);
        setBoardPostEngagement(postId, { liked: false, likeCount: nextUnlikeCount });
        setDetail((prev) =>
          prev
            ? {
                ...prev,
                liked: false,
                likeCount: Math.max(0, prev.likeCount - 1),
              }
            : null,
        );
      } else {
        await likePost(postId);
        setBoardPostEngagement(postId, { liked: true, likeCount: nextLikeCountAfterLike });
        setDetail((prev) =>
          prev
            ? {
                ...prev,
                liked: true,
                likeCount: prev.likeCount + 1,
              }
            : null,
        );
      }
    } catch (e) {
      alert(getErrorMessage(e));
    } finally {
      setLiking(false);
    }
  };

  return (
    <MobileFrame className="bg-[#f3f4f5]">
      <div className="flex min-h-screen flex-1 flex-col bg-[#f3f4f5]">
        <BackHeader listPath={listPath} />
        <main className="flex flex-1 flex-col gap-[10px] pb-[56px] sm:pb-[60px]">
          {loading ? (
            <p className="px-[20px] py-[24px] text-center text-[14px] text-[#868b94]">
              불러오는 중…
            </p>
          ) : null}
          {loadError ? (
            <div className="flex flex-col items-center gap-[16px] px-[20px] py-[32px]">
              <p className="text-center text-[14px] leading-[20px] text-[#868b94]">{loadError}</p>
              <button
                type="button"
                className="rounded-[8px] border border-[#dcdee3] px-[14px] py-[8px] text-[13px] font-medium text-[#4d5159]"
                onClick={() => navigate({ to: listPath })}
              >
                목록으로
              </button>
            </div>
          ) : null}
          {!loading && detail ? (
            <PostDetailSection
              detail={detail}
              listPath={listPath}
              liking={liking}
              onToggleLike={handleToggleLike}
            />
          ) : null}
        </main>
      </div>
      <BottomNav />
    </MobileFrame>
  );
};

export default BbangticlePostDetailPage;
