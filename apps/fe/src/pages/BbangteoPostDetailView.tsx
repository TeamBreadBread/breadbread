import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  createComment,
  deleteComment,
  deletePost,
  getPost,
  isCommentAuthor,
  isPostAuthor,
  likePost,
  type CommentResponse,
  type PostDetail,
  unlikePost,
  updateComment,
} from "@/api/posts";
import { getErrorMessage, ApiBusinessError } from "@/api/types/common";
import ArrowLeft from "@/assets/icons/ArrowLeft.svg";
import currationBreadImg from "@/assets/images/Curration_CardBread.png";
import BottomNav from "@/components/layout/BottomNav";
import {
  BBANGTEO_FIXED_HEADER_OUTER_CLASS,
  FIXED_TOP_BAR_SPACER_CLASS,
} from "@/components/layout/layout.constants";
import MobileFrame from "@/components/layout/MobileFrame";
import { getMockPostDetailById, isBbangteoMockPostId } from "@/data/bbangteoCommunityMocks";
import {
  applyOverlayToPostDetail,
  persistDetailToLikeOverlay,
  setPostLikeOverlay,
} from "@/lib/postLikeLocalCache";
import { formatInstantInSeoul } from "@/utils/formatSeoulDateTime";

type BbangteoPostDetailViewProps = {
  postId: number;
  listPath: "/bbangteo-board" | "/bbangteo-article-board";
};

/** 게시판 목록과 동일한 하트 실루엣, 상세용 크기·좋아요 여부 */
function PostDetailLikeHeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      aria-hidden
      className={
        filled
          ? "shrink-0 red_700 pointer-events-none"
          : "shrink-0 text-[#868b94] pointer-events-none"
      }
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

const DateTimeText = ({ date, time }: { date: string; time: string }) => (
  <div className="flex items-start gap-[6px]">
    <span className="whitespace-nowrap text-[12px] leading-[16px] text-[#868b94]">{date}</span>
    <span className="whitespace-nowrap text-[12px] leading-[16px] text-[#868b94]">{time}</span>
  </div>
);

function ProfileAvatar({ url }: { url: string | null | undefined }) {
  if (url) {
    return (
      <img
        src={url}
        alt=""
        className="h-[40px] w-[40px] shrink-0 rounded-full border border-[#eeeff1] object-cover"
      />
    );
  }
  return (
    <div className="h-[40px] w-[40px] shrink-0 rounded-full border border-[#eeeff1] bg-[#f7f8f9]" />
  );
}

const ImageRow = ({ urls }: { urls: string[] }) => {
  if (urls.length === 0) return null;
  return (
    <div className="flex h-[110px] items-center gap-[6px] overflow-x-auto">
      {urls.map((url, index) => (
        <div
          key={`${url}-${index}`}
          className="flex h-[110px] w-[110px] shrink-0 items-center justify-center overflow-hidden rounded-[8px] bg-[#f3f4f5]"
        >
          <img
            src={url}
            alt={`게시글 이미지 ${index + 1}`}
            className="h-full w-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = currationBreadImg;
            }}
          />
        </div>
      ))}
    </div>
  );
};

export default function BbangteoPostDetailView({ postId, listPath }: BbangteoPostDetailViewProps) {
  const navigate = useNavigate();
  const [detail, setDetail] = useState<PostDetail | null>(null);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);
  const [likeBusy, setLikeBusy] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentBusy, setCommentBusy] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");
  /** 초기/중복 load와 좋아요 직후 getPost가 끝나는 순서가 뒤바뀌면 오래된 응답이 상세를 덮어쓰지 않도록 함 */
  const detailFetchGen = useRef(0);
  const likePendingRef = useRef(false);

  const load = useCallback(async () => {
    if (!postId) {
      setLoadError("잘못된 게시글입니다.");
      setLoading(false);
      return;
    }
    if (isBbangteoMockPostId(postId)) {
      const gen = ++detailFetchGen.current;
      try {
        setLoading(true);
        setLoadError("");
        const m = getMockPostDetailById(postId);
        if (gen !== detailFetchGen.current) return;
        if (m) {
          const merged = applyOverlayToPostDetail(m);
          setDetail(merged);
          persistDetailToLikeOverlay(merged);
          setLoadError("");
        } else {
          setDetail(null);
          setLoadError("게시글을 찾을 수 없습니다.");
        }
      } finally {
        if (gen === detailFetchGen.current) {
          setLoading(false);
        }
      }
      return;
    }
    const gen = ++detailFetchGen.current;
    try {
      setLoading(true);
      setLoadError("");
      const d = await getPost(postId);
      if (gen !== detailFetchGen.current) return;
      setDetail(d);
      persistDetailToLikeOverlay(d);
    } catch (e) {
      if (gen !== detailFetchGen.current) return;
      setLoadError(getErrorMessage(e));
      setDetail(null);
    } finally {
      if (gen === detailFetchGen.current) {
        setLoading(false);
      }
    }
  }, [postId]);

  useEffect(() => {
    void load();
  }, [load]);

  const onToggleLike = async () => {
    if (!detail || likeBusy || likePendingRef.current) return;
    if (isBbangteoMockPostId(detail.id)) {
      const wasLiked = detail.liked;
      const prevCount = detail.likeCount;
      const next = {
        ...detail,
        liked: !wasLiked,
        likeCount: wasLiked ? Math.max(0, prevCount - 1) : prevCount + 1,
      };
      setDetail(next);
      persistDetailToLikeOverlay(next);
      return;
    }
    const id = detail.id;
    const wasLiked = detail.liked;
    const prevCount = detail.likeCount;
    likePendingRef.current = true;
    setDetail({
      ...detail,
      liked: !wasLiked,
      likeCount: wasLiked ? Math.max(0, prevCount - 1) : prevCount + 1,
    });
    setLikeBusy(true);
    try {
      if (wasLiked) {
        await unlikePost(id);
      } else {
        await likePost(id);
      }
      const fresh = await getPost(id);
      detailFetchGen.current += 1;
      setDetail(fresh);
      persistDetailToLikeOverlay(fresh);
    } catch (e) {
      setPostLikeOverlay(id, { liked: wasLiked, likeCount: prevCount });
      setDetail((d) => (d && d.id === id ? { ...d, liked: wasLiked, likeCount: prevCount } : d));
      if (e instanceof ApiBusinessError) {
        if (e.status === 401) {
          alert("로그인 후 좋아요할 수 있습니다.");
          return;
        }
        if (e.status === 409 && !wasLiked) {
          try {
            const fresh = await getPost(id);
            detailFetchGen.current += 1;
            setDetail(fresh);
            persistDetailToLikeOverlay(fresh);
          } catch {
            /* 서버와 동기화 실패 시 무시 */
          }
          return;
        }
        if (e.status === 400 && wasLiked) {
          try {
            const fresh = await getPost(id);
            detailFetchGen.current += 1;
            setDetail(fresh);
            persistDetailToLikeOverlay(fresh);
          } catch {
            /* 서버와 동기화 실패 시 무시 */
          }
          return;
        }
      }
      alert(getErrorMessage(e) || "좋아요 처리에 실패했습니다.");
    } finally {
      likePendingRef.current = false;
      setLikeBusy(false);
    }
  };

  const onDeletePost = async () => {
    if (!detail) return;
    if (isBbangteoMockPostId(detail.id)) {
      alert("데모 게시글은 삭제할 수 없습니다.");
      return;
    }
    if (!window.confirm("이 게시글을 삭제할까요?")) return;
    try {
      await deletePost(detail.id);
      navigate({ to: listPath });
    } catch (e) {
      alert(getErrorMessage(e) || "삭제에 실패했습니다.");
    }
  };

  const onSubmitComment = async () => {
    if (!detail) return;
    if (listPath !== "/bbangteo-board") return;
    if (isBbangteoMockPostId(detail.id)) {
      alert("데모 게시글에서는 댓글을 등록할 수 없습니다.");
      return;
    }
    const text = commentText.trim();
    if (!text) return;
    setCommentBusy(true);
    try {
      await createComment(detail.id, { content: text });
      setCommentText("");
      await load();
    } catch (e) {
      alert(getErrorMessage(e) || "댓글 등록에 실패했습니다.");
    } finally {
      setCommentBusy(false);
    }
  };

  const startEditComment = (c: CommentResponse) => {
    setEditingId(c.id);
    setEditingText(c.content);
  };

  const cancelEditComment = () => {
    setEditingId(null);
    setEditingText("");
  };

  const saveEditComment = async (commentId: number) => {
    if (!detail) return;
    const text = editingText.trim();
    if (!text) return;
    try {
      await updateComment(detail.id, commentId, { content: text });
      cancelEditComment();
      await load();
    } catch (e) {
      alert(getErrorMessage(e) || "댓글 수정에 실패했습니다.");
    }
  };

  const onDeleteComment = async (commentId: number) => {
    if (!detail) return;
    if (!window.confirm("댓글을 삭제할까요?")) return;
    try {
      await deleteComment(detail.id, commentId);
      await load();
    } catch (e) {
      alert(getErrorMessage(e) || "댓글 삭제에 실패했습니다.");
    }
  };

  const author = detail ? isPostAuthor(detail) && !isBbangteoMockPostId(detail.id) : false;
  const mockPost = detail ? isBbangteoMockPostId(detail.id) : false;
  /** 공지·빵티클(빵빵 소식) 게시판은 댓글 없음 */
  const commentsEnabled = listPath === "/bbangteo-board";
  const { date: postDate, time: postTime } = detail
    ? formatInstantInSeoul(detail.createdAt)
    : { date: "-", time: "" };

  return (
    <MobileFrame className="bg-[#f3f4f5]">
      <div className="flex min-h-screen flex-1 flex-col bg-[#f3f4f5]">
        <header className={BBANGTEO_FIXED_HEADER_OUTER_CLASS}>
          <div className="flex h-[56px] items-center justify-between px-[20px]">
            <button
              type="button"
              className="flex h-[36px] w-[36px] items-center justify-center"
              onClick={() => navigate({ to: listPath })}
            >
              <img src={ArrowLeft} alt="뒤로가기" className="h-[24px] w-[24px]" />
            </button>
            {author && detail ? (
              <div className="flex items-center gap-[8px]">
                <button
                  type="button"
                  className="text-[13px] font-medium text-[#555d6d]"
                  onClick={() =>
                    navigate({ to: "/bbangteo-board-write", search: { editId: detail.id } })
                  }
                >
                  수정
                </button>
                <button
                  type="button"
                  className="text-[13px] font-medium text-[#d32f2f]"
                  onClick={() => void onDeletePost()}
                >
                  삭제
                </button>
              </div>
            ) : (
              <div className="h-[36px] w-[36px]" />
            )}
          </div>
        </header>
        <div className={FIXED_TOP_BAR_SPACER_CLASS} aria-hidden />

        <main
          className={
            commentsEnabled
              ? "flex flex-1 flex-col gap-[10px] pb-[calc(56px+64px)] sm:pb-[calc(60px+64px)]"
              : "flex flex-1 flex-col gap-[10px] pb-[56px] sm:pb-[60px]"
          }
        >
          {loading ? <p className="px-[20px] py-[24px] text-[#868b94]">불러오는 중...</p> : null}
          {!loading && loadError ? (
            <p className="px-[20px] py-[24px] text-[#d32f2f]">{loadError}</p>
          ) : null}
          {!loading && detail ? (
            <>
              <section className="flex flex-col gap-[24px] bg-white p-[20px]">
                <div className="flex h-[40px] items-center gap-[10px]">
                  <ProfileAvatar url={detail.profileImageUrl} />
                  <div className="flex flex-1 flex-col gap-[2px]">
                    <div className="text-[13px] leading-[18px] font-bold text-[#1a1c20]">
                      {detail.nickname}
                    </div>
                    <DateTimeText date={postDate} time={postTime} />
                  </div>
                </div>
                <div className="flex flex-col gap-[16px]">
                  <div className="flex flex-col gap-[10px]">
                    <h1 className="text-[18px] leading-[24px] font-bold text-[#1a1c20]">
                      {detail.title}
                    </h1>
                    <p className="whitespace-pre-line text-[16px] leading-[22px] text-[#1a1c20]">
                      {detail.content}
                    </p>
                  </div>
                  <ImageRow urls={detail.imageUrls} />
                </div>
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    className="flex items-center gap-[6px]"
                    onClick={() => navigate({ to: listPath })}
                  >
                    <img src={ArrowLeft} alt="" className="h-[18px] w-[18px]" aria-hidden />
                    <span className="text-[14px] leading-[19px] text-[#1a1c20]">목록으로</span>
                  </button>
                  <button
                    type="button"
                    disabled={likeBusy}
                    aria-label={detail.liked ? "좋아요 취소" : "좋아요"}
                    aria-pressed={detail.liked}
                    className="relative z-[52] flex min-h-[44px] min-w-[44px] items-center justify-end gap-[6px] rounded-[8px] px-[6px] disabled:opacity-50 touch-manipulation"
                    onClick={() => void onToggleLike()}
                  >
                    <PostDetailLikeHeartIcon filled={detail.liked} />
                    <span
                      className={
                        detail.liked
                          ? "text-[14px] leading-[19px] red_700"
                          : "text-[14px] leading-[19px] text-[#1a1c20]"
                      }
                    >
                      {detail.likeCount}
                    </span>
                  </button>
                </div>
              </section>

              {commentsEnabled ? (
                <section className="flex flex-col gap-[24px] bg-white p-[20px]">
                  <div className="flex items-center gap-[4px]">
                    <span className="text-[13px] leading-[18px] font-bold text-[#555d6d]">
                      댓글
                    </span>
                    <span className="text-[13px] leading-[18px] font-medium text-[#555d6d]">
                      {detail.commentListResponse.total}
                    </span>
                  </div>
                  <div className="flex flex-col gap-[20px]">
                    {detail.commentListResponse.comments.map((c) => {
                      const { date, time } = formatInstantInSeoul(c.createdAt);
                      const mine = isCommentAuthor(c);
                      return (
                        <article key={c.id} className="flex min-h-[80px] items-start gap-[10px]">
                          <ProfileAvatar url={c.profileImageUrl} />
                          <div className="flex flex-1 flex-col gap-[4px]">
                            <div className="flex items-center justify-between gap-[8px]">
                              <div className="text-[13px] leading-[18px] font-bold text-[#1a1c20]">
                                {c.nickname}
                              </div>
                              {mine ? (
                                <div className="flex shrink-0 gap-[6px]">
                                  {editingId === c.id ? (
                                    <>
                                      <button
                                        type="button"
                                        className="text-[12px] text-[#555d6d]"
                                        onClick={cancelEditComment}
                                      >
                                        취소
                                      </button>
                                      <button
                                        type="button"
                                        className="text-[12px] text-[#1a1c20]"
                                        onClick={() => void saveEditComment(c.id)}
                                      >
                                        저장
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <button
                                        type="button"
                                        className="text-[12px] text-[#555d6d]"
                                        onClick={() => startEditComment(c)}
                                      >
                                        수정
                                      </button>
                                      <button
                                        type="button"
                                        className="text-[12px] text-[#d32f2f]"
                                        onClick={() => void onDeleteComment(c.id)}
                                      >
                                        삭제
                                      </button>
                                    </>
                                  )}
                                </div>
                              ) : null}
                            </div>
                            {editingId === c.id ? (
                              <textarea
                                value={editingText}
                                onChange={(e) => setEditingText(e.target.value)}
                                rows={3}
                                className="w-full resize-y rounded-[8px] border border-[#dcdee3] px-[10px] py-[8px] text-[14px] text-[#1a1c20] outline-none"
                              />
                            ) : (
                              <p className="text-[14px] leading-[19px] text-[#1a1c20]">
                                {c.content}
                              </p>
                            )}
                            <DateTimeText date={date} time={time} />
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              ) : null}
            </>
          ) : null}
        </main>
      </div>

      {detail && commentsEnabled ? (
        <div
          className="fixed bottom-[56px] left-1/2 z-[49] w-full max-w-[402px] -translate-x-1/2 border-t border-[#eeeff1] bg-white px-[20px] py-[10px] md:bottom-[60px] md:max-w-[744px]"
          style={{ touchAction: "manipulation" as const }}
        >
          <div className="flex h-[44px] items-center gap-[8px] rounded-[9999px] bg-[#f3f4f5] px-[14px]">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={
                mockPost ? "데모 글에서는 댓글을 등록할 수 없어요" : "댓글을 입력해주세요"
              }
              disabled={commentBusy || mockPost}
              className="min-h-[44px] min-w-0 flex-1 touch-manipulation bg-transparent text-[16px] leading-[22px] text-[#1a1c20] placeholder:text-[#868b94] outline-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !mockPost) void onSubmitComment();
              }}
            />
            <button
              type="button"
              disabled={commentBusy || mockPost || !commentText.trim()}
              className="shrink-0 text-[13px] font-medium text-[#555d6d] disabled:opacity-40"
              onClick={() => void onSubmitComment()}
            >
              등록
            </button>
          </div>
        </div>
      ) : null}
      <BottomNav />
    </MobileFrame>
  );
}
