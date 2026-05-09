import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { getStoredAccessToken } from "@/api/auth";
import { createPost, getPost, updatePost } from "@/api/posts";
import { uploadImages } from "@/api/image";
import { getErrorMessage } from "@/api/types/common";
import ArrowLeft from "@/assets/icons/ArrowLeft.svg";
import BottomNav from "@/components/layout/BottomNav";
import {
  BBANGTEO_FIXED_HEADER_OUTER_CLASS,
  FIXED_TOP_BAR_SPACER_CLASS,
} from "@/components/layout/layout.constants";
import MobileFrame from "@/components/layout/MobileFrame";
import {
  prependUserCreatedFreePost,
  upsertUserCreatedFreePost,
} from "@/state/boardUserCreatedFreePosts";

type SelectedLocalImage = {
  id: string;
  file: File;
};

const WriteHeader = ({
  mode,
  canSubmit,
  isSubmitting,
  onSubmit,
  onBack,
}: {
  mode: "create" | "edit";
  canSubmit: boolean;
  isSubmitting: boolean;
  onSubmit: () => void;
  onBack: () => void;
}) => {
  return (
    <>
      <header className={BBANGTEO_FIXED_HEADER_OUTER_CLASS}>
        <div className="flex h-[56px] items-center justify-between px-[20px]">
          <button
            type="button"
            className="flex h-[36px] w-[36px] shrink-0 items-center justify-center"
            onClick={onBack}
          >
            <img src={ArrowLeft} alt="뒤로가기" className="h-[24px] w-[24px]" />
          </button>
          <button
            type="button"
            className={`shrink-0 text-[18px] leading-[24px] font-medium ${
              canSubmit && !isSubmitting ? "text-[#1a1c20]" : "text-[#b0b3ba]"
            }`}
            disabled={!canSubmit || isSubmitting}
            onClick={onSubmit}
          >
            {isSubmitting
              ? mode === "edit"
                ? "수정 중…"
                : "게시 중…"
              : mode === "edit"
                ? "완료"
                : "게시"}
          </button>
        </div>
      </header>
      <div className={FIXED_TOP_BAR_SPACER_CLASS} aria-hidden />
    </>
  );
};

/** 백엔드 GCS 허용 타입과 동일 */
const ALLOWED_PREVIEW_IMAGE_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);

const PREVIEW_PX = 88;

function drawImageCover(
  ctx: CanvasRenderingContext2D,
  bitmap: ImageBitmap,
  width: number,
  height: number,
): void {
  const bw = bitmap.width;
  const bh = bitmap.height;
  if (bw === 0 || bh === 0) {
    return;
  }
  const scale = Math.max(width / bw, height / bh);
  const dw = bw * scale;
  const dh = bh * scale;
  const dx = (width - dw) / 2;
  const dy = (height - dh) / 2;
  ctx.drawImage(bitmap, 0, 0, bw, bh, dx, dy, dw, dh);
}

function LocalImageThumbnail({
  file,
  previewIndex,
  onRemove,
}: {
  file: File;
  previewIndex: number;
  onRemove: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !ALLOWED_PREVIEW_IMAGE_TYPES.has(file.type)) {
      return;
    }

    let cancelled = false;

    const paint = async () => {
      let bitmap: ImageBitmap | null = null;
      try {
        bitmap = await createImageBitmap(file);
      } catch {
        return;
      }
      if (cancelled) {
        bitmap.close();
        return;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        bitmap.close();
        return;
      }

      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const px = Math.round(PREVIEW_PX * dpr);
      canvas.width = px;
      canvas.height = px;
      canvas.style.width = `${PREVIEW_PX}px`;
      canvas.style.height = `${PREVIEW_PX}px`;
      ctx.clearRect(0, 0, px, px);
      drawImageCover(ctx, bitmap, px, px);
      bitmap.close();
    };

    void paint();

    return () => {
      cancelled = true;
    };
  }, [file, previewIndex]);

  return (
    <div className="relative h-[88px] w-[88px] shrink-0">
      <canvas
        ref={canvasRef}
        className="block rounded-[10px] bg-[#eeeff1]"
        width={PREVIEW_PX}
        height={PREVIEW_PX}
        aria-label={`선택 이미지 ${previewIndex + 1}`}
        role="img"
      />
      <button
        type="button"
        aria-label={`이미지 ${previewIndex + 1} 삭제`}
        className="absolute right-[4px] top-[4px] flex h-[20px] w-[20px] items-center justify-center rounded-full bg-black/60 text-[12px] text-white"
        onClick={onRemove}
      >
        ×
      </button>
    </div>
  );
}

function ExistingUrlThumbnail({
  url,
  index,
  onRemove,
}: {
  url: string;
  index: number;
  onRemove: () => void;
}) {
  return (
    <div className="relative h-[88px] w-[88px] shrink-0 overflow-hidden rounded-[10px] bg-[#eeeff1]">
      <img
        src={url}
        alt={`등록 이미지 ${index + 1}`}
        className="h-full w-full object-cover"
        loading="lazy"
      />
      <button
        type="button"
        aria-label={`등록 이미지 ${index + 1} 삭제`}
        className="absolute right-[4px] top-[4px] flex h-[20px] w-[20px] items-center justify-center rounded-full bg-black/60 text-[12px] text-white"
        onClick={onRemove}
      >
        ×
      </button>
    </div>
  );
}

type BbangteoBoardWritePageProps = {
  editPostId?: number;
};

function dateLabelFromIso(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return `${String(new Date().getFullYear()).slice(-2)}.${String(new Date().getMonth() + 1).padStart(2, "0")}.${String(new Date().getDate()).padStart(2, "0")}`;
  }
  return `${String(d.getFullYear()).slice(-2)}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

const BbangteoBoardWritePage = ({ editPostId }: BbangteoBoardWritePageProps) => {
  const navigate = useNavigate();
  const mode: "create" | "edit" = editPostId != null ? "edit" : "create";
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [selectedImages, setSelectedImages] = useState<SelectedLocalImage[]>([]);
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
  const [editLoadedMeta, setEditLoadedMeta] = useState<{
    createdAt: string;
    commentCount: number;
    likeCount: number;
  } | null>(null);
  const [draftLoading, setDraftLoading] = useState(editPostId != null);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!getStoredAccessToken()) {
      navigate({
        to: "/login",
        search: { redirect: "/bbangteo-board-write" },
        replace: true,
      });
    }
  }, [navigate]);

  useEffect(() => {
    if (editPostId == null) {
      setDraftLoading(false);
      setDraftError(null);
      setEditLoadedMeta(null);
      setExistingImageUrls([]);
      return;
    }

    let cancelled = false;
    setDraftLoading(true);
    setDraftError(null);

    (async () => {
      try {
        const detail = await getPost(editPostId);
        if (cancelled) {
          return;
        }
        if (!detail.author) {
          alert("이 글을 수정할 권한이 없습니다.");
          navigate({ to: "/bbangteo-board", search: { listRefresh: undefined } });
          return;
        }
        setTitle(detail.title);
        setBody(detail.content);
        setExistingImageUrls(detail.imageUrls ?? []);
        setEditLoadedMeta({
          createdAt: detail.createdAt,
          commentCount: detail.commentListResponse.total,
          likeCount: detail.likeCount,
        });
        setSelectedImages([]);
      } catch (error) {
        if (cancelled) {
          return;
        }
        const msg = getErrorMessage(error) || "글을 불러오지 못했습니다.";
        setDraftError(msg);
        setEditLoadedMeta(null);
      } finally {
        if (!cancelled) {
          setDraftLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [editPostId, navigate]);

  const canSubmit =
    title.trim().length > 0 && body.trim().length > 0 && !draftLoading && draftError == null;

  const handleBack = () => {
    if (editPostId != null) {
      navigate({
        to: "/bbangteo-board-post-detail",
        search: { postId: editPostId, detailRefresh: Date.now() },
      });
      return;
    }
    navigate({ to: "/bbangteo-board", search: { listRefresh: undefined } });
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) {
      return;
    }
    setSelectedImages((prev) => [
      ...prev,
      ...files.map((file) => ({ id: crypto.randomUUID(), file })),
    ]);
    event.target.value = "";
  };

  const handleRemoveImage = (id: string) => {
    setSelectedImages((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSubmit = async () => {
    if (!canSubmit || isSubmitting) {
      return;
    }
    if (!getStoredAccessToken()) {
      navigate({ to: "/login", search: { redirect: "/bbangteo-board-write" } });
      return;
    }

    setIsSubmitting(true);
    try {
      const files = selectedImages.map((item) => item.file);
      const newUrls = files.length > 0 ? await uploadImages(files) : [];

      if (editPostId != null) {
        const imageUrls = [...existingImageUrls, ...newUrls];
        await updatePost(editPostId, {
          title: title.trim(),
          content: body.trim(),
          imageUrls,
        });
        const createdAt = editLoadedMeta?.createdAt ?? new Date().toISOString();
        upsertUserCreatedFreePost({
          id: editPostId,
          title: title.trim(),
          thumbnailImageUrl: imageUrls[0] ?? null,
          likeCount: editLoadedMeta?.likeCount ?? 0,
          commentCount: editLoadedMeta?.commentCount ?? 0,
          dateLabel: dateLabelFromIso(createdAt),
          postType: "FREE",
          createdAt,
        });
        navigate({
          to: "/bbangteo-board-post-detail",
          search: { postId: editPostId, detailRefresh: Date.now() },
        });
        return;
      }

      const postId = await createPost({
        title: title.trim(),
        content: body.trim(),
        postType: "FREE",
        imageUrls: newUrls,
      });

      const now = new Date();
      prependUserCreatedFreePost({
        id: postId,
        title: title.trim(),
        thumbnailImageUrl: newUrls[0] ?? null,
        likeCount: 0,
        commentCount: 0,
        dateLabel: dateLabelFromIso(now.toISOString()),
        postType: "FREE",
        createdAt: now.toISOString(),
      });

      navigate({ to: "/bbangteo-board", search: { listRefresh: Date.now() } });
    } catch (error) {
      const msg = getErrorMessage(error) || "게시물 업로드 중 오류가 발생했습니다.";
      if (msg.includes("접근 권한") || msg.includes("권한이 없습니다") || msg.includes("E0002")) {
        navigate({ to: "/login", search: { redirect: "/bbangteo-board-write" } });
        return;
      }
      alert(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MobileFrame className="bg-white">
      <div className="flex min-h-screen flex-1 flex-col bg-white">
        <WriteHeader
          mode={mode}
          canSubmit={canSubmit}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
          onBack={handleBack}
        />
        <main className="flex flex-1 flex-col gap-[10px] px-[20px] pb-[calc(56px+52px)] pt-5 sm:pb-[calc(60px+52px)]">
          {draftLoading ? (
            <p className="text-center text-[14px] text-[#868b94]">불러오는 중…</p>
          ) : null}
          {!draftLoading && draftError ? (
            <div className="flex flex-col items-center gap-[12px] py-[24px]">
              <p className="text-center text-[14px] text-[#868b94]">{draftError}</p>
              <button
                type="button"
                className="rounded-[8px] border border-[#dcdee3] px-[14px] py-[8px] text-[13px] font-medium text-[#4d5159]"
                onClick={() => {
                  if (editPostId != null) {
                    navigate({
                      to: "/bbangteo-board-post-detail",
                      search: { postId: editPostId, detailRefresh: undefined },
                    });
                  } else {
                    navigate({ to: "/bbangteo-board", search: { listRefresh: undefined } });
                  }
                }}
              >
                돌아가기
              </button>
            </div>
          ) : null}
          {!draftLoading && !draftError ? (
            <>
              <label className="sr-only" htmlFor="post-title">
                제목
              </label>
              <input
                id="post-title"
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="제목을 입력하세요."
                disabled={draftLoading}
                className="w-full resize-none bg-transparent text-[18px] leading-[24px] font-bold text-[#1a1c20] placeholder:text-[#b0b3ba] outline-none disabled:opacity-60"
              />
              <label className="sr-only" htmlFor="post-body">
                내용
              </label>
              <textarea
                id="post-body"
                value={body}
                onChange={(event) => setBody(event.target.value)}
                placeholder="내용을 입력하세요."
                rows={14}
                disabled={draftLoading}
                className="min-h-[200px] w-full resize-y bg-transparent text-[16px] leading-[22px] text-[#1a1c20] placeholder:text-[#b0b3ba] outline-none disabled:opacity-60"
              />
              {existingImageUrls.length > 0 || selectedImages.length > 0 ? (
                <div className="mt-[8px] flex gap-[10px] overflow-x-auto pb-[4px]">
                  {existingImageUrls.map((url, index) => (
                    <ExistingUrlThumbnail
                      key={`${url}-${index}`}
                      url={url}
                      index={index}
                      onRemove={() =>
                        setExistingImageUrls((prev) => prev.filter((_, i) => i !== index))
                      }
                    />
                  ))}
                  {selectedImages.map((item, index) => (
                    <LocalImageThumbnail
                      key={item.id}
                      file={item.file}
                      previewIndex={existingImageUrls.length + index}
                      onRemove={() => handleRemoveImage(item.id)}
                    />
                  ))}
                </div>
              ) : null}
            </>
          ) : null}
        </main>
        {!draftLoading && !draftError ? (
          <div className="fixed bottom-[56px] left-1/2 z-40 flex w-full max-w-[402px] -translate-x-1/2 flex-col bg-white pb-[env(safe-area-inset-bottom,0)] sm:bottom-[60px] md:max-w-[744px]">
            <div className="flex items-center justify-start border-t border-[#eeeff1] bg-white px-[14px] py-[8px]">
              <button
                type="button"
                aria-label="이미지 첨부"
                className="flex items-center gap-[6px] rounded-[8px] border border-[#dcdee3] px-[10px] py-[6px] text-[13px] leading-[18px] font-medium text-[#4d5159]"
                onClick={() => fileInputRef.current?.click()}
              >
                <span aria-hidden>+</span>
                <span>이미지</span>
                {existingImageUrls.length + selectedImages.length > 0 ? (
                  <span>({existingImageUrls.length + selectedImages.length})</span>
                ) : null}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImageSelect}
              />
            </div>
          </div>
        ) : null}
      </div>
      <BottomNav />
    </MobileFrame>
  );
};

export default BbangteoBoardWritePage;
