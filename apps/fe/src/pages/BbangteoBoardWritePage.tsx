import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
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

const MAX_IMAGES = 5;

type SelectedLocalImage = {
  id: string;
  file: File;
};

type BbangteoBoardWritePageProps = {
  editPostId?: number;
};

const WriteHeader = ({
  canSubmit,
  isSubmitting,
  onSubmit,
  isEdit,
}: {
  canSubmit: boolean;
  isSubmitting: boolean;
  onSubmit: () => void;
  isEdit: boolean;
}) => {
  const navigate = useNavigate();

  return (
    <>
      <header className={BBANGTEO_FIXED_HEADER_OUTER_CLASS}>
        <div className="flex h-[56px] items-center justify-between px-[20px]">
          <button
            type="button"
            className="flex h-[36px] w-[36px] shrink-0 items-center justify-center"
            onClick={() => navigate({ to: "/bbangteo-board" })}
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
            {isSubmitting ? (isEdit ? "저장 중..." : "게시 중...") : isEdit ? "저장" : "게시"}
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

function RemoteImageThumb({ url, onRemove }: { url: string; onRemove: () => void }) {
  return (
    <div className="relative h-[88px] w-[88px] shrink-0 overflow-hidden rounded-[10px] bg-[#eeeff1]">
      <img src={url} alt="" className="h-full w-full object-cover" />
      <button
        type="button"
        aria-label="첨부 이미지 삭제"
        className="absolute right-[4px] top-[4px] flex h-[20px] w-[20px] items-center justify-center rounded-full bg-black/60 text-[12px] text-white"
        onClick={onRemove}
      >
        ×
      </button>
    </div>
  );
}

const BbangteoBoardWritePage = ({ editPostId }: BbangteoBoardWritePageProps) => {
  const navigate = useNavigate();
  const isEdit = editPostId != null && editPostId > 0;
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [selectedImages, setSelectedImages] = useState<SelectedLocalImage[]>([]);
  const [remoteImageUrls, setRemoteImageUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const totalImageCount = remoteImageUrls.length + selectedImages.length;
  const canSubmit = title.trim().length > 0 && body.trim().length > 0;

  useEffect(() => {
    if (!isEdit || !editPostId) return;
    let cancelled = false;
    void (async () => {
      try {
        setLoadingEdit(true);
        const d = await getPost(editPostId);
        if (cancelled) return;
        setTitle(d.title);
        setBody(d.content);
        setRemoteImageUrls([...d.imageUrls]);
        setSelectedImages([]);
      } catch (e) {
        alert(getErrorMessage(e) || "게시글을 불러오지 못했습니다.");
        navigate({ to: "/bbangteo-board" });
      } finally {
        if (!cancelled) setLoadingEdit(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [editPostId, isEdit, navigate]);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) {
      return;
    }
    const room = MAX_IMAGES - remoteImageUrls.length - selectedImages.length;
    const next = files.slice(0, Math.max(0, room));
    if (next.length < files.length) {
      alert(`이미지는 최대 ${MAX_IMAGES}장까지 첨부할 수 있습니다.`);
    }
    setSelectedImages((prev) => [
      ...prev,
      ...next.map((file) => ({ id: crypto.randomUUID(), file })),
    ]);
    event.target.value = "";
  };

  const handleRemoveLocal = (id: string) => {
    setSelectedImages((prev) => prev.filter((item) => item.id !== id));
  };

  const handleRemoveRemote = (url: string) => {
    setRemoteImageUrls((prev) => prev.filter((u) => u !== url));
  };

  const handleSubmit = async () => {
    if (!canSubmit || isSubmitting || loadingEdit) {
      return;
    }

    setIsSubmitting(true);
    try {
      const files = selectedImages.map((item) => item.file);
      const uploaded = files.length > 0 ? await uploadImages(files) : [];
      const imageUrls = [...remoteImageUrls, ...uploaded].slice(0, MAX_IMAGES);

      if (isEdit && editPostId) {
        await updatePost(editPostId, {
          title: title.trim(),
          content: body.trim(),
          imageUrls,
        });
        navigate({ to: "/bbangteo-board-post-detail", search: { id: editPostId } });
        return;
      }

      const newId = await createPost({
        title: title.trim(),
        content: body.trim(),
        postType: "FREE",
        imageUrls,
      });
      navigate({ to: "/bbangteo-board-post-detail", search: { id: newId } });
    } catch (error) {
      alert(getErrorMessage(error) || "게시물 저장 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MobileFrame className="bg-white">
      <div className="flex min-h-screen flex-1 flex-col bg-white">
        <WriteHeader
          canSubmit={canSubmit}
          isSubmitting={isSubmitting}
          onSubmit={() => void handleSubmit()}
          isEdit={isEdit}
        />
        <main className="flex flex-1 flex-col gap-[10px] px-[20px] pb-[calc(56px+52px)] pt-5 sm:pb-[calc(60px+52px)]">
          {loadingEdit ? <p className="text-[#868b94]">불러오는 중...</p> : null}
          <label className="sr-only" htmlFor="post-title">
            제목
          </label>
          <input
            id="post-title"
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="제목을 입력하세요."
            disabled={loadingEdit}
            className="w-full resize-none bg-transparent text-[18px] leading-[24px] font-bold text-[#1a1c20] placeholder:text-[#b0b3ba] outline-none disabled:opacity-50"
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
            disabled={loadingEdit}
            className="min-h-[200px] w-full resize-y bg-transparent text-[16px] leading-[22px] text-[#1a1c20] placeholder:text-[#b0b3ba] outline-none disabled:opacity-50"
          />
          {totalImageCount > 0 ? (
            <div className="mt-[8px] flex flex-wrap gap-[10px] pb-[4px]">
              {remoteImageUrls.map((url) => (
                <RemoteImageThumb key={url} url={url} onRemove={() => handleRemoveRemote(url)} />
              ))}
              {selectedImages.map((item, index) => (
                <LocalImageThumbnail
                  key={item.id}
                  file={item.file}
                  previewIndex={remoteImageUrls.length + index}
                  onRemove={() => handleRemoveLocal(item.id)}
                />
              ))}
            </div>
          ) : null}
        </main>
        <div className="fixed bottom-[56px] left-1/2 z-40 flex w-full max-w-[402px] -translate-x-1/2 flex-col bg-white pb-[env(safe-area-inset-bottom,0)] sm:bottom-[60px] md:max-w-[744px]">
          <div className="flex items-center justify-start border-t border-[#eeeff1] bg-white px-[14px] py-[8px]">
            <button
              type="button"
              aria-label="이미지 첨부"
              disabled={loadingEdit || totalImageCount >= MAX_IMAGES}
              className="flex items-center gap-[6px] rounded-[8px] border border-[#dcdee3] px-[10px] py-[6px] text-[13px] leading-[18px] font-medium text-[#4d5159] disabled:opacity-40"
              onClick={() => fileInputRef.current?.click()}
            >
              <span aria-hidden>+</span>
              <span>이미지</span>
              {totalImageCount > 0 ? (
                <span>
                  ({totalImageCount}/{MAX_IMAGES})
                </span>
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
      </div>
      <BottomNav />
    </MobileFrame>
  );
};

export default BbangteoBoardWritePage;
