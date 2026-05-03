import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { apiClient } from "@/api/client";
import { uploadImages } from "@/api/image";
import { getErrorMessage, type ApiEnvelope } from "@/api/types/common";
import ArrowLeft from "@/assets/icons/ArrowLeft.svg";
import BottomNav from "@/components/layout/BottomNav";
import MobileFrame from "@/components/layout/MobileFrame";

type BoardPostPayload = {
  title: string;
  content: string;
  imageUrls: string[];
};

type SelectedLocalImage = {
  id: string;
  file: File;
};

async function createBoardPost(payload: BoardPostPayload): Promise<void> {
  await apiClient.post<ApiEnvelope<void>>("/api/posts", payload);
}

const WriteHeader = ({
  canSubmit,
  isSubmitting,
  onSubmit,
}: {
  canSubmit: boolean;
  isSubmitting: boolean;
  onSubmit: () => void;
}) => {
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 left-1/2 z-40 flex h-[56px] w-full max-w-[402px] -translate-x-1/2 items-center justify-between border-b border-[#eeeff1] bg-white px-[20px] py-[10px] md:max-w-[744px]">
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
        {isSubmitting ? "게시 중..." : "게시"}
      </button>
    </header>
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

/**
 * CodeQL js/xss-through-dom: `img.src` / `blob:` 경로를 쓰지 않고,
 * `createImageBitmap` → canvas 픽셀 복사로만 미리보기합니다.
 */
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

const BbangteoBoardWritePage = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [selectedImages, setSelectedImages] = useState<SelectedLocalImage[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const canSubmit = title.trim().length > 0 && body.trim().length > 0;

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

    setIsSubmitting(true);
    try {
      const files = selectedImages.map((item) => item.file);
      const imageUrls = files.length > 0 ? await uploadImages(files) : [];

      await createBoardPost({
        title: title.trim(),
        content: body.trim(),
        imageUrls,
      });

      navigate({ to: "/bbangteo-board" });
    } catch (error) {
      alert(getErrorMessage(error) || "게시물 업로드 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MobileFrame className="bg-white">
      <div className="flex min-h-screen flex-1 flex-col bg-white">
        <WriteHeader canSubmit={canSubmit} isSubmitting={isSubmitting} onSubmit={handleSubmit} />
        <main className="flex flex-1 flex-col gap-[10px] px-[20px] pb-[calc(56px+52px)] pt-[76px] sm:pb-[calc(60px+52px)]">
          <label className="sr-only" htmlFor="post-title">
            제목
          </label>
          <input
            id="post-title"
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="제목을 입력하세요."
            className="w-full resize-none bg-transparent text-[18px] leading-[24px] font-bold text-[#1a1c20] placeholder:text-[#b0b3ba] outline-none"
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
            className="min-h-[200px] w-full resize-y bg-transparent text-[16px] leading-[22px] text-[#1a1c20] placeholder:text-[#b0b3ba] outline-none"
          />
          {selectedImages.length > 0 ? (
            <div className="mt-[8px] flex gap-[10px] overflow-x-auto pb-[4px]">
              {selectedImages.map((item, index) => (
                <LocalImageThumbnail
                  key={item.id}
                  file={item.file}
                  previewIndex={index}
                  onRemove={() => handleRemoveImage(item.id)}
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
              className="flex items-center gap-[6px] rounded-[8px] border border-[#dcdee3] px-[10px] py-[6px] text-[13px] leading-[18px] font-medium text-[#4d5159]"
              onClick={() => fileInputRef.current?.click()}
            >
              <span aria-hidden>+</span>
              <span>이미지</span>
              {selectedImages.length > 0 ? <span>({selectedImages.length})</span> : null}
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
