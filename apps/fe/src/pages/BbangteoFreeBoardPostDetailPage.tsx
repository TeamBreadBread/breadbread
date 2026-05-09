import { type PointerEvent, useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import ArrowLeft from "@/assets/icons/ArrowLeft.svg";
import currationBreadImg from "@/assets/images/Curration_CardBread.png";
import { getStoredAccessToken } from "@/api/auth";
import {
  createComment,
  deleteComment,
  deletePost,
  getPost,
  likePost,
  type PostDetail,
  unlikePost,
  updateComment,
} from "@/api/posts";
import type { CommentItem as CommentRow } from "@/api/posts";
import {
  getMockFreeBoardPostDetail,
  isMockFreeBoardPostId,
  shouldUseBoardMock,
} from "@/data/bbangteoBoardMock";
import {
  clearBoardPostLikeOverridesForPostIds,
  mergeBoardPostEngagementIntoDetail,
  setBoardPostEngagement,
} from "@/state/boardPostLikeOverrides";
import { removeUserCreatedFreePost } from "@/state/boardUserCreatedFreePosts";
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

export type FreeBoardPostDetailPageProps = {
  postId?: number;
  listPath: "/bbangteo-board";
  /** 수정·등록 후 상세 재조회 */
  detailRefresh?: number;
};

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

const BackHeader = ({ listPath }: { listPath: "/bbangteo-board" }) => {
  const navigate = useNavigate();
  return (
    <>
      <header className={BBANGTEO_FIXED_HEADER_OUTER_CLASS}>
        <div className="flex h-[56px] items-center justify-between px-[20px]">
          <button
            type="button"
            className="flex h-[36px] w-[36px] items-center justify-center"
            onClick={() => navigate({ to: listPath, search: { listRefresh: undefined } })}
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

const AuthorHeader = ({
  nickname,
  profileImageUrl,
  date,
  time,
  canManagePost,
  deleting,
  onEditPost,
  onDeletePost,
}: {
  nickname: string;
  profileImageUrl: string | null;
  date: string;
  time: string;
  canManagePost: boolean;
  deleting: boolean;
  onEditPost: () => void;
  onDeletePost: () => void;
}) => (
  <div className="flex gap-[10px]">
    <Avatar nickname={nickname} profileImageUrl={profileImageUrl} />
    <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
      <div className="flex min-h-[40px] items-center justify-between gap-[12px]">
        <div className="min-w-0 text-[13px] leading-[18px] font-bold text-[#1a1c20] break-words">
          {nickname}
        </div>
        {canManagePost ? (
          <div className="flex shrink-0 items-center gap-[10px]">
            <button
              type="button"
              className="text-[13px] leading-[18px] font-medium text-[#868b94] disabled:opacity-50"
              disabled={deleting}
              onClick={onEditPost}
            >
              수정
            </button>
            <button
              type="button"
              className="text-[13px] leading-[18px] font-medium text-[#868b94] disabled:opacity-50"
              disabled={deleting}
              onClick={() => void onDeletePost()}
            >
              {deleting ? "삭제 중…" : "삭제"}
            </button>
          </div>
        ) : null}
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
  listPath: "/bbangteo-board";
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
        onClick={() => navigate({ to: listPath, search: { listRefresh: undefined } })}
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
  canManagePost,
  deleting,
  onEditPost,
  onDeletePost,
}: {
  detail: PostDetail;
  listPath: "/bbangteo-board";
  liking: boolean;
  onToggleLike: () => void;
  canManagePost: boolean;
  deleting: boolean;
  onEditPost: () => void;
  onDeletePost: () => void;
}) => {
  const { date, time } = formatDetailDateParts(detail.createdAt);
  const urls = detail.imageUrls ?? [];

  return (
    <section className="flex flex-col gap-[24px] bg-white p-[20px]">
      <AuthorHeader
        nickname={detail.nickname}
        profileImageUrl={detail.profileImageUrl}
        date={date}
        time={time}
        canManagePost={canManagePost}
        deleting={deleting}
        onEditPost={onEditPost}
        onDeletePost={onDeletePost}
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

const FreeBoardCommentRow = ({
  comment,
  busy,
  onUpdate,
  onDelete,
}: {
  comment: CommentRow;
  busy: boolean;
  onUpdate: (commentId: number, content: string) => Promise<void>;
  onDelete: (commentId: number) => Promise<void>;
}) => {
  const { date, time } = formatDetailDateParts(comment.createdAt);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.content);

  const actionButtonClass =
    "shrink-0 text-[13px] leading-[18px] font-medium text-[#868b94] disabled:opacity-50";

  return (
    <article className="flex min-h-[80px] items-start gap-[10px]">
      <Avatar nickname={comment.nickname} profileImageUrl={comment.profileImageUrl} />
      <div className="flex min-w-0 flex-1 flex-col gap-[4px]">
        <div className="flex items-start justify-between gap-[10px]">
          <div className="text-[13px] leading-[18px] font-bold text-[#1a1c20]">
            {comment.nickname}
          </div>
          {comment.author && !editing ? (
            <div className="flex shrink-0 items-center gap-[10px]">
              <button
                type="button"
                className={actionButtonClass}
                disabled={busy}
                onClick={() => {
                  setDraft(comment.content);
                  setEditing(true);
                }}
              >
                수정
              </button>
              <button
                type="button"
                className={actionButtonClass}
                disabled={busy}
                onClick={() => void onDelete(comment.id)}
              >
                삭제
              </button>
            </div>
          ) : null}
        </div>
        {editing ? (
          <div className="flex flex-col gap-[8px]">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={3}
              disabled={busy}
              className="w-full resize-y rounded-[8px] border border-[#eeeff1] bg-[#f7f8f9] px-[12px] py-[8px] text-[14px] leading-[19px] text-[#1a1c20] outline-none focus:border-[#dcdee3] disabled:opacity-50"
            />
            <div className="flex justify-end gap-[10px]">
              <button
                type="button"
                className={actionButtonClass}
                disabled={busy}
                onClick={() => {
                  setEditing(false);
                  setDraft(comment.content);
                }}
              >
                취소
              </button>
              <button
                type="button"
                className="text-[13px] leading-[18px] font-medium text-[#555d6d] disabled:opacity-50"
                disabled={busy || !draft.trim()}
                onClick={async () => {
                  const next = draft.trim();
                  if (!next) {
                    return;
                  }
                  await onUpdate(comment.id, next);
                  setEditing(false);
                }}
              >
                확인
              </button>
            </div>
          </div>
        ) : (
          <p className="whitespace-pre-line text-[14px] leading-[19px] text-[#1a1c20]">
            {comment.content}
          </p>
        )}
        <DateTimeText date={date} time={time} />
      </div>
    </article>
  );
};

const CommentList = ({
  comments,
  busyCommentId,
  onUpdateComment,
  onDeleteComment,
}: {
  comments: CommentRow[];
  busyCommentId: number | null;
  onUpdateComment: (commentId: number, content: string) => Promise<void>;
  onDeleteComment: (commentId: number) => Promise<void>;
}) => (
  <div className="flex flex-col gap-[20px]">
    {comments.map((comment) => (
      <FreeBoardCommentRow
        key={comment.id}
        comment={comment}
        busy={busyCommentId === comment.id}
        onUpdate={onUpdateComment}
        onDelete={onDeleteComment}
      />
    ))}
  </div>
);

const CommentSection = ({
  comments,
  total,
  busyCommentId,
  onUpdateComment,
  onDeleteComment,
}: {
  comments: CommentRow[];
  total: number;
  busyCommentId: number | null;
  onUpdateComment: (commentId: number, content: string) => Promise<void>;
  onDeleteComment: (commentId: number) => Promise<void>;
}) => (
  <section className="flex flex-col gap-[24px] bg-white p-[20px]">
    <div className="flex items-center gap-[4px]">
      <span className="text-[13px] leading-[18px] font-bold text-[#555d6d]">댓글</span>
      <span className="text-[13px] leading-[18px] font-medium text-[#555d6d]">{total}</span>
    </div>
    <CommentList
      comments={comments}
      busyCommentId={busyCommentId}
      onUpdateComment={onUpdateComment}
      onDeleteComment={onDeleteComment}
    />
  </section>
);

const CommentInputBar = ({
  submitting,
  onSubmit,
}: {
  submitting: boolean;
  onSubmit: (content: string) => Promise<void>;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState("");

  const focusCommentInput = () => {
    const el = inputRef.current;
    if (!el) return;
    el.focus({ preventScroll: false });
  };

  const handleBarPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("button[data-comment-submit]")) return;
    focusCommentInput();
  };

  const handleSubmit = async () => {
    const trimmed = draft.trim();
    if (!trimmed || submitting) {
      return;
    }
    await onSubmit(trimmed);
    setDraft("");
  };

  return (
    <div
      className="fixed bottom-[56px] left-1/2 z-[49] w-full max-w-[402px] -translate-x-1/2 border-t border-[#eeeff1] bg-white px-[20px] py-[10px] md:bottom-[60px] md:max-w-[744px]"
      style={{ touchAction: "manipulation" as const }}
    >
      <div
        className="flex h-[44px] cursor-text items-center gap-[8px] rounded-[9999px] bg-[#f3f4f5] px-[14px]"
        onPointerDown={handleBarPointerDown}
        role="presentation"
      >
        <input
          ref={inputRef}
          type="text"
          name="free-board-comment"
          inputMode="text"
          enterKeyHint="send"
          autoComplete="off"
          autoCorrect="on"
          autoCapitalize="sentences"
          placeholder="댓글을 입력해주세요"
          value={draft}
          disabled={submitting}
          onChange={(e) => setDraft(e.target.value)}
          className="min-h-[44px] min-w-0 flex-1 touch-manipulation bg-transparent text-[16px] leading-[22px] text-[#1a1c20] placeholder:text-[#868b94] outline-none"
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void handleSubmit();
            }
          }}
          onFocus={(event) => {
            requestAnimationFrame(() => {
              event.target.scrollIntoView({ block: "center", behavior: "smooth" });
            });
          }}
        />
        <button
          type="button"
          data-comment-submit
          disabled={submitting || !draft.trim()}
          className="shrink-0 text-[13px] leading-[18px] font-medium text-[#555d6d] disabled:opacity-40"
          onClick={() => void handleSubmit()}
        >
          등록
        </button>
      </div>
    </div>
  );
};

const FreeBoardPostDetailPage = ({
  postId,
  listPath,
  detailRefresh,
}: FreeBoardPostDetailPageProps) => {
  const navigate = useNavigate();
  const [detail, setDetail] = useState<PostDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [liking, setLiking] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [commentBusyId, setCommentBusyId] = useState<number | null>(null);
  const [commentSubmitting, setCommentSubmitting] = useState(false);

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
          const local = getMockFreeBoardPostDetail(postId);
          if (local) {
            if (!cancelled) {
              setDetail(mergeBoardPostEngagementIntoDetail(postId, local));
            }
            return;
          }
        }
        const data = await getPost(postId);
        if (cancelled) return;
        setDetail(mergeBoardPostEngagementIntoDetail(postId, data));
      } catch (e) {
        if (cancelled) return;
        const fallback = getMockFreeBoardPostDetail(postId);
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
  }, [postId, detailRefresh]);

  const handleToggleLike = async () => {
    if (postId == null || !detail || liking) {
      return;
    }
    if (isMockFreeBoardPostId(postId)) {
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

  const handleCommentUpdate = async (commentId: number, content: string) => {
    if (postId == null || !detail) {
      return;
    }
    if (!getStoredAccessToken() && !isMockFreeBoardPostId(postId)) {
      navigate({ to: "/login", search: { redirect: "/bbangteo-board" } });
      return;
    }
    setCommentBusyId(commentId);
    try {
      if (isMockFreeBoardPostId(postId)) {
        setDetail((prev) => {
          if (!prev) {
            return prev;
          }
          return {
            ...prev,
            commentListResponse: {
              ...prev.commentListResponse,
              comments: prev.commentListResponse.comments.map((c) =>
                c.id === commentId ? { ...c, content } : c,
              ),
            },
          };
        });
        return;
      }
      await updateComment(postId, commentId, content);
      setDetail((prev) => {
        if (!prev) {
          return prev;
        }
        return {
          ...prev,
          commentListResponse: {
            ...prev.commentListResponse,
            comments: prev.commentListResponse.comments.map((c) =>
              c.id === commentId ? { ...c, content } : c,
            ),
          },
        };
      });
    } catch (e) {
      alert(getErrorMessage(e));
    } finally {
      setCommentBusyId(null);
    }
  };

  const handleCommentDelete = async (commentId: number) => {
    if (postId == null || !detail) {
      return;
    }
    if (!window.confirm("댓글을 삭제할까요?")) {
      return;
    }
    if (!getStoredAccessToken() && !isMockFreeBoardPostId(postId)) {
      navigate({ to: "/login", search: { redirect: "/bbangteo-board" } });
      return;
    }
    setCommentBusyId(commentId);
    try {
      if (isMockFreeBoardPostId(postId)) {
        setDetail((prev) => {
          if (!prev) {
            return prev;
          }
          const comments = prev.commentListResponse.comments.filter((c) => c.id !== commentId);
          return {
            ...prev,
            commentListResponse: {
              comments,
              total: Math.max(0, prev.commentListResponse.total - 1),
            },
          };
        });
        return;
      }
      await deleteComment(postId, commentId);
      setDetail((prev) => {
        if (!prev) {
          return prev;
        }
        const comments = prev.commentListResponse.comments.filter((c) => c.id !== commentId);
        return {
          ...prev,
          commentListResponse: {
            comments,
            total: Math.max(0, prev.commentListResponse.total - 1),
          },
        };
      });
    } catch (e) {
      alert(getErrorMessage(e));
    } finally {
      setCommentBusyId(null);
    }
  };

  const handleCommentSubmit = async (content: string) => {
    if (postId == null || !detail) {
      return;
    }
    setCommentSubmitting(true);
    try {
      if (isMockFreeBoardPostId(postId)) {
        const now = new Date().toISOString();
        const created: CommentRow = {
          id: Date.now(),
          nickname: "나",
          profileImageUrl: null,
          content,
          createdAt: now,
          author: true,
        };
        setDetail((prev) => {
          if (!prev) {
            return prev;
          }
          return {
            ...prev,
            commentListResponse: {
              comments: [...prev.commentListResponse.comments, created],
              total: prev.commentListResponse.total + 1,
            },
          };
        });
        return;
      }
      const created = await createComment(postId, content);
      setDetail((prev) => {
        if (!prev) {
          return prev;
        }
        const prevComments = prev.commentListResponse.comments;
        const nextComments = [...prevComments, created];
        return {
          ...prev,
          commentListResponse: {
            comments: nextComments,
            total: prev.commentListResponse.total + 1,
          },
        };
      });
    } catch (e) {
      alert(getErrorMessage(e));
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleEditPost = () => {
    if (postId == null || isMockFreeBoardPostId(postId)) {
      return;
    }
    if (!getStoredAccessToken()) {
      navigate({ to: "/login", search: { redirect: "/bbangteo-board-write" } });
      return;
    }
    navigate({ to: "/bbangteo-board-write", search: { editPostId: postId } });
  };

  const handleDeletePost = async () => {
    if (postId == null || deleting || !detail?.author || isMockFreeBoardPostId(postId)) {
      return;
    }
    if (!window.confirm("이 게시글을 삭제할까요?")) {
      return;
    }
    if (!getStoredAccessToken()) {
      navigate({ to: "/login", search: { redirect: "/bbangteo-board" } });
      return;
    }
    setDeleting(true);
    try {
      await deletePost(postId);
      removeUserCreatedFreePost(postId);
      clearBoardPostLikeOverridesForPostIds([postId]);
      navigate({ to: listPath, search: { listRefresh: Date.now() } });
    } catch (e) {
      alert(getErrorMessage(e));
    } finally {
      setDeleting(false);
    }
  };

  const canManagePost = postId != null && Boolean(detail?.author) && !isMockFreeBoardPostId(postId);

  const invalidRequest = postId == null;

  return (
    <MobileFrame className="bg-[#f3f4f5]">
      <div className="flex min-h-screen flex-1 flex-col bg-[#f3f4f5]">
        <BackHeader listPath={listPath} />
        <main className="flex flex-1 flex-col gap-[10px] pb-[calc(56px+64px)] sm:pb-[calc(60px+64px)]">
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
                onClick={() => navigate({ to: listPath, search: { listRefresh: undefined } })}
              >
                목록으로
              </button>
            </div>
          ) : null}
          {!loading && detail ? (
            <>
              <PostDetailSection
                detail={detail}
                listPath={listPath}
                liking={liking}
                onToggleLike={handleToggleLike}
                canManagePost={canManagePost}
                deleting={deleting}
                onEditPost={handleEditPost}
                onDeletePost={handleDeletePost}
              />
              <CommentSection
                comments={detail.commentListResponse.comments}
                total={detail.commentListResponse.total}
                busyCommentId={commentBusyId}
                onUpdateComment={handleCommentUpdate}
                onDeleteComment={handleCommentDelete}
              />
            </>
          ) : null}
        </main>
      </div>
      {!loading && detail && !invalidRequest ? (
        <CommentInputBar submitting={commentSubmitting} onSubmit={handleCommentSubmit} />
      ) : null}
      <BottomNav />
    </MobileFrame>
  );
};

export default FreeBoardPostDetailPage;
