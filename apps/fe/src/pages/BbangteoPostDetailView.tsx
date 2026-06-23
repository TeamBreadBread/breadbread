import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { uploadImages } from "@/api/image";
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
import currationBreadImg from "@/assets/images/Curration_CardBread.png";
import { ImageUploadPreviewStrip } from "@/components/common/ImageUploadPreview";
import { UserProfileAvatar } from "@/components/common/UserProfileAvatar";
import { AppIcon, IconAssets } from "@/components/icons";
import { ToolbarHeartLikeIcon } from "@/components/icons/PostDetailToolbarIcons";
import BottomNav from "@/components/layout/BottomNav";
import {
  BBANGTEO_FIXED_HEADER_OUTER_CLASS,
  FIXED_TOP_BAR_SPACER_CLASS,
} from "@/components/layout/layout.constants";
import MobileFrame from "@/components/layout/MobileFrame";
import { getMockPostDetailById, isBbangteoMockPostId } from "@/data/bbangteoCommunityMocks";
import { useLoginRequired } from "@/lib/auth/useLoginRequired";
import {
  applyOverlayToPostDetail,
  persistDetailToLikeOverlay,
  setPostLikeOverlay,
} from "@/lib/postLikeLocalCache";
import { cn } from "@/utils/cn";
import { formatInstantInSeoul } from "@/utils/formatSeoulDateTime";
import { buildBbakeryDetailSearch } from "@/utils/bakeryListEntry";

type BbangteoPostDetailViewProps = {
  postId: number;
  listPath: "/bbangteo-board" | "/bbangteo-article-board";
};

const MAX_COMMENT_IMAGES = 3;

type SelectedCommentImage = {
  id: string;
  file: File;
};

function PostDetailLikeHeartIcon({ filled }: { filled: boolean }) {
  return <ToolbarHeartLikeIcon liked={filled} size={18} className="pointer-events-none" />;
}

const DateTimeText = ({ date, time }: { date: string; time: string }) => (
  <div className="flex items-start gap-[6px]">
    <span className="whitespace-nowrap text-[12px] leading-[16px] text-[#868b94]">{date}</span>
    <span className="whitespace-nowrap text-[12px] leading-[16px] text-[#868b94]">{time}</span>
  </div>
);

const ImageRow = ({ urls, size = 110 }: { urls: string[]; size?: number }) => {
  if (urls.length === 0) return null;
  return (
    <div className="flex items-center gap-[6px] overflow-x-auto" style={{ height: size }}>
      {urls.map((url, index) => (
        <div
          key={`${url}-${index}`}
          className="flex shrink-0 items-center justify-center overflow-hidden rounded-[8px] bg-[#f3f4f5]"
          style={{ width: size, height: size }}
        >
          <img
            src={url}
            alt={`첨부 이미지 ${index + 1}`}
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
  const { requireLogin } = useLoginRequired();
  const [detail, setDetail] = useState<PostDetail | null>(null);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);
  const [likeBusy, setLikeBusy] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentImages, setCommentImages] = useState<SelectedCommentImage[]>([]);
  const [commentBusy, setCommentBusy] = useState(false);
  const commentFileInputRef = useRef<HTMLInputElement | null>(null);
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
      const d = applyOverlayToPostDetail(await getPost(postId));
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

  const performToggleLike = async () => {
    if (!detail || likeBusy || likePendingRef.current) return;
    if (isBbangteoMockPostId(detail.id)) {
      const wasLiked = detail.liked;
      const prevCount = detail.likeCount;
      const nextLiked = !wasLiked;
      const nextCount = wasLiked ? Math.max(0, prevCount - 1) : prevCount + 1;
      const next = { ...detail, liked: nextLiked, likeCount: nextCount };
      setDetail(next);
      persistDetailToLikeOverlay(next);
      return;
    }
    const id = detail.id;
    const wasLiked = detail.liked;
    const prevCount = detail.likeCount;
    likePendingRef.current = true;
    const nextLiked = !wasLiked;
    const optimisticCount = wasLiked ? Math.max(0, prevCount - 1) : prevCount + 1;
    setDetail({ ...detail, liked: nextLiked, likeCount: optimisticCount });
    setPostLikeOverlay(id, { liked: nextLiked, likeCount: optimisticCount });
    setLikeBusy(true);
    try {
      if (wasLiked) {
        await unlikePost(id);
      } else {
        await likePost(id);
      }
      let resolvedCount = optimisticCount;
      try {
        const fresh = await getPost(id);
        detailFetchGen.current += 1;
        resolvedCount = Math.max(optimisticCount, fresh.likeCount ?? optimisticCount);
      } catch {
        /* 카운트 동기화 실패 시 UI liked 상태는 유지 */
      }
      setDetail((d) =>
        d && d.id === id ? { ...d, liked: nextLiked, likeCount: resolvedCount } : d,
      );
      setPostLikeOverlay(id, { liked: nextLiked, likeCount: resolvedCount });
    } catch (e) {
      setPostLikeOverlay(id, { liked: wasLiked, likeCount: prevCount });
      setDetail((d) => (d && d.id === id ? { ...d, liked: wasLiked, likeCount: prevCount } : d));
      if (e instanceof ApiBusinessError) {
        if (e.status === 409 && !wasLiked) {
          try {
            const fresh = await getPost(id);
            detailFetchGen.current += 1;
            const resolvedCount = Math.max(prevCount + 1, fresh.likeCount ?? prevCount + 1);
            setDetail((d) =>
              d && d.id === id ? { ...d, liked: true, likeCount: resolvedCount } : d,
            );
            setPostLikeOverlay(id, { liked: true, likeCount: resolvedCount });
          } catch {
            setDetail((d) =>
              d && d.id === id ? { ...d, liked: true, likeCount: prevCount + 1 } : d,
            );
            setPostLikeOverlay(id, { liked: true, likeCount: prevCount + 1 });
          }
          return;
        }
        if (e.status === 400 && wasLiked) {
          try {
            const fresh = await getPost(id);
            detailFetchGen.current += 1;
            const resolvedCount = Math.max(0, fresh.likeCount ?? prevCount - 1);
            setDetail((d) =>
              d && d.id === id ? { ...d, liked: false, likeCount: resolvedCount } : d,
            );
            setPostLikeOverlay(id, { liked: false, likeCount: resolvedCount });
          } catch {
            setDetail((d) =>
              d && d.id === id ? { ...d, liked: false, likeCount: Math.max(0, prevCount - 1) } : d,
            );
            setPostLikeOverlay(id, { liked: false, likeCount: Math.max(0, prevCount - 1) });
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

  const onToggleLike = () => {
    const returnPath =
      listPath === "/bbangteo-article-board" ? "/bbangteo-article-board" : "/bbangteo-board";
    requireLogin(() => {
      void performToggleLike();
    }, returnPath);
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
      const files = commentImages.map((item) => item.file);
      const uploaded = files.length > 0 ? await uploadImages(files, "posts") : [];
      const imageUrls = uploaded.slice(0, MAX_COMMENT_IMAGES);
      await createComment(detail.id, {
        content: text,
        ...(imageUrls.length > 0 ? { imageUrls } : {}),
      });
      setCommentText("");
      setCommentImages([]);
      await load();
    } catch (e) {
      alert(getErrorMessage(e) || "댓글 등록에 실패했습니다.");
    } finally {
      setCommentBusy(false);
    }
  };

  const handleCommentImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    const room = MAX_COMMENT_IMAGES - commentImages.length;
    const next = files.slice(0, Math.max(0, room));
    if (next.length < files.length) {
      alert(`댓글 이미지는 최대 ${MAX_COMMENT_IMAGES}장까지 첨부할 수 있습니다.`);
    }
    setCommentImages((prev) => [
      ...prev,
      ...next.map((file) => ({ id: crypto.randomUUID(), file })),
    ]);
    event.target.value = "";
  };

  const handleRemoveCommentImage = (id: string) => {
    setCommentImages((prev) => prev.filter((item) => item.id !== id));
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
  const commentImagePreviewHeight = commentImages.length > 0 ? 96 : 0;
  const canSubmitComment = Boolean(commentText.trim()) && !commentBusy && !mockPost;
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
              <AppIcon src={IconAssets.IcChevronLeft} size="x6" alt="뒤로가기" />
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
          className={cn(
            "flex flex-1 flex-col gap-[10px]",
            commentsEnabled
              ? "pb-[calc(56px+64px+env(safe-area-inset-bottom,0px))] sm:pb-[calc(60px+64px+env(safe-area-inset-bottom,0px))]"
              : "pb-[56px] sm:pb-[60px]",
          )}
          style={
            commentsEnabled && commentImagePreviewHeight > 0
              ? {
                  paddingBottom: `calc(56px + 64px + ${commentImagePreviewHeight}px + env(safe-area-inset-bottom, 0px))`,
                }
              : undefined
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
                  <div className="h-[40px] w-[40px] shrink-0 overflow-hidden rounded-full border border-[#eeeff1] bg-[#f7f8f9]">
                    <UserProfileAvatar
                      profileImageUrl={detail.profileImageUrl}
                      seed={detail.nickname}
                      className="h-full w-full"
                    />
                  </div>
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
                  {detail.bakeryId != null && detail.bakeryId > 0 && detail.bakeryName?.trim() ? (
                    <button
                      type="button"
                      className="inline-flex items-center gap-[4px] self-start text-[14px] leading-[19px] font-semibold text-[#E8623A]"
                      onClick={() =>
                        void navigate({
                          to: "/bbangteo-bakery-detail",
                          search: buildBbakeryDetailSearch({
                            bakeryId: detail.bakeryId ?? undefined,
                            from: "bbangteo",
                          }),
                        })
                      }
                    >
                      <span aria-hidden>📍</span>
                      <span>{detail.bakeryName.trim()}</span>
                    </button>
                  ) : null}
                  <ImageRow urls={detail.imageUrls} />
                </div>
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    className="flex items-center gap-[6px]"
                    onClick={() => navigate({ to: listPath })}
                  >
                    <AppIcon src={IconAssets.IcChevronLeft} size={18} />
                    <span className="text-[14px] leading-[19px] text-[#1a1c20]">목록으로</span>
                  </button>
                  <button
                    type="button"
                    aria-label={detail.liked ? "좋아요 취소" : "좋아요"}
                    aria-pressed={detail.liked}
                    className="relative z-[52] flex min-h-[44px] min-w-[44px] items-center justify-end gap-[6px] rounded-[8px] px-[6px] touch-manipulation"
                    onClick={() => void onToggleLike()}
                  >
                    <PostDetailLikeHeartIcon filled={detail.liked} />
                    <span
                      className={
                        detail.liked
                          ? "text-[14px] leading-[19px] text-orange-600"
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
                          <div className="h-[40px] w-[40px] shrink-0 overflow-hidden rounded-full border border-[#eeeff1] bg-[#f7f8f9]">
                            <UserProfileAvatar
                              profileImageUrl={c.profileImageUrl}
                              seed={c.nickname}
                              className="h-full w-full"
                            />
                          </div>
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
                              <div className="flex flex-col gap-[8px]">
                                <p className="text-[14px] leading-[19px] text-[#1a1c20]">
                                  {c.content}
                                </p>
                                <ImageRow urls={c.imageUrls ?? []} size={72} />
                              </div>
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
          className="fixed bottom-[56px] left-1/2 z-[49] w-full max-w-[402px] -translate-x-1/2 border-t border-[#eeeff1] bg-white px-[20px] py-[10px] md:bottom-[60px]"
          style={{ touchAction: "manipulation" as const }}
        >
          {commentImages.length > 0 ? (
            <ImageUploadPreviewStrip
              className="mb-[8px] flex flex-wrap gap-[8px]"
              localFiles={commentImages.map((item) => item.file)}
              onRemoveLocal={(index) => {
                const target = commentImages[index];
                if (target) handleRemoveCommentImage(target.id);
              }}
            />
          ) : null}
          <div className="flex h-[44px] items-center gap-[8px] rounded-[9999px] bg-[#f3f4f5] px-[10px]">
            <button
              type="button"
              aria-label="댓글 이미지 첨부"
              disabled={commentBusy || mockPost || commentImages.length >= MAX_COMMENT_IMAGES}
              className="flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-full disabled:opacity-40"
              onClick={() => commentFileInputRef.current?.click()}
            >
              <AppIcon src={IconAssets.IcImageLine} size={20} className="opacity-70" alt="" />
            </button>
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
              disabled={!canSubmitComment}
              aria-label="댓글 전송"
              className={cn(
                "flex h-[28px] w-[28px] shrink-0 items-center justify-center",
                canSubmitComment ? "text-orange-600" : "text-gray-600",
              )}
              onClick={() => void onSubmitComment()}
            >
              <svg width={22} height={22} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M4.4462 19.9126C4.10187 20.0546 3.77475 20.0236 3.46485 19.8193C3.15495 19.6151 3 19.3176 3 18.9268V14.1313L11.264 12L3 9.86867V5.07318C3 4.68244 3.15495 4.38494 3.46485 4.18068C3.77475 3.97643 4.10187 3.94535 4.4462 4.08744L20.3544 11.0143C20.7848 11.2096 21 11.5382 21 12C21 12.4618 20.7848 12.7904 20.3544 12.9857L4.4462 19.9126Z" />
              </svg>
            </button>
          </div>
          <input
            ref={commentFileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleCommentImageSelect}
          />
        </div>
      ) : null}
      <BottomNav />
    </MobileFrame>
  );
}
