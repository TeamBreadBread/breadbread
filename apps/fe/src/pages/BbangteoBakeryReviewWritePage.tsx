import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { createBakeryReview, getBakeryReviews, updateBakeryReview } from "@/api/bakery";
import { uploadImages } from "@/api/image";
import { getErrorMessage } from "@/api/types/common";
import ArrowLeft from "@/assets/icons/ArrowLeft.svg";
import MobileFrame from "@/components/layout/MobileFrame";
import {
  BBANGTEO_FIXED_HEADER_OUTER_CLASS,
  FIXED_TOP_BAR_SPACER_CLASS,
} from "@/components/layout/layout.constants";
import type { BakeryListEntryFrom } from "@/utils/bakeryListEntry";

interface BbangteoBakeryReviewWritePageProps {
  bakeryId?: number;
  /** 있으면 PATCH(수정) 모드 */
  reviewId?: number;
  listEntryFrom?: BakeryListEntryFrom;
}

function ConfirmExitDialog({ onExit, onContinue }: { onExit: () => void; onContinue: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-[20px]">
      <div className="flex w-[300px] flex-col gap-[24px] rounded-[24px] bg-white p-[24px]">
        <div className="flex flex-col items-center gap-[6px]">
          <h2 className="text-center text-[20px] leading-[27px] font-bold text-[#1a1c20]">
            후기 작성을 취소하시겠어요?
          </h2>
          <p className="text-center text-[16px] leading-[22px] text-[#1a1c20]">
            지금 나가시면 작성 중인 내용이
            <br />
            모두 사라집니다.
          </p>
        </div>
        <div className="flex items-center justify-center gap-[10px]">
          <button
            type="button"
            className="flex flex-1 items-center justify-center rounded-[12px] bg-[#eeeff1] px-[16px] py-[14px] text-[14px] leading-[19px] font-bold text-[#1a1c20]"
            onClick={onExit}
          >
            나가기
          </button>
          <button
            type="button"
            className="flex flex-1 items-center justify-center rounded-[12px] bg-[#555d6d] px-[16px] py-[14px] text-[14px] leading-[19px] font-bold text-white"
            onClick={onContinue}
          >
            계속 작성하기
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BbangteoBakeryReviewWritePage({
  bakeryId,
  reviewId,
  listEntryFrom,
}: BbangteoBakeryReviewWritePageProps) {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState("");
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [isLoadingReview, setIsLoadingReview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = useMemo(() => rating > 0 && content.trim().length > 0, [rating, content]);

  useEffect(() => {
    if (bakeryId === undefined || reviewId === undefined) return;

    let cancelled = false;
    void (async () => {
      setIsLoadingReview(true);
      setLoadError("");
      try {
        const res = await getBakeryReviews(bakeryId, { sort: "LATEST", page: 0, size: 100 });
        const found = res.reviews.find((r) => r.id === reviewId);
        if (cancelled) return;
        if (!found) {
          setLoadError("리뷰를 찾을 수 없습니다.");
          return;
        }
        setRating(found.rating);
        setContent(found.content);
        setUploadedImageUrls(found.imageUrls ? [...found.imageUrls] : []);
      } catch (e) {
        if (!cancelled) {
          setLoadError(getErrorMessage(e));
        }
      } finally {
        if (!cancelled) setIsLoadingReview(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [bakeryId, reviewId]);

  const goToBakeryDetail = (reviewUploaded: boolean) => {
    void navigate({
      to: "/bbangteo-bakery-detail",
      search: {
        bakeryId,
        from: listEntryFrom,
        courseId: undefined,
        reviewTab: true,
        reviewUploaded,
      },
    });
  };

  const handleSubmit = () => {
    if (!canSubmit || bakeryId === undefined || isSubmitting) return;
    void (async () => {
      try {
        setIsSubmitting(true);
        const payload = {
          rating,
          content: content.trim(),
          imageUrls: uploadedImageUrls.length > 0 ? uploadedImageUrls.slice(0, 2) : undefined,
        };
        if (reviewId !== undefined) {
          await updateBakeryReview(bakeryId, reviewId, payload);
        } else {
          await createBakeryReview(bakeryId, payload);
        }
        goToBakeryDetail(true);
      } catch (error) {
        alert(getErrorMessage(error));
      } finally {
        setIsSubmitting(false);
      }
    })();
  };

  const MAX_REVIEW_IMAGES = 2;

  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    setIsUploadingImages(true);
    try {
      const room = Math.max(0, MAX_REVIEW_IMAGES - uploadedImageUrls.length);
      if (room === 0) {
        alert(`이미지는 최대 ${MAX_REVIEW_IMAGES}장까지 첨부할 수 있습니다.`);
        return;
      }
      const uploadedUrls = await uploadImages(files.slice(0, room));
      setUploadedImageUrls((prev) => [...prev, ...uploadedUrls].slice(0, MAX_REVIEW_IMAGES));
    } catch (error) {
      alert(getErrorMessage(error) || "이미지 업로드 중 오류가 발생했습니다.");
    } finally {
      setIsUploadingImages(false);
      event.target.value = "";
    }
  };

  return (
    <MobileFrame className="bg-white">
      <div className="flex min-h-screen flex-1 flex-col bg-white">
        <>
          <header className={BBANGTEO_FIXED_HEADER_OUTER_CLASS}>
            <div className="flex h-[56px] items-center justify-between px-[20px]">
              <button
                type="button"
                className="flex h-[36px] w-[36px] items-center justify-center"
                onClick={() => setShowExitDialog(true)}
                aria-label="뒤로가기"
              >
                <img src={ArrowLeft} alt="" className="h-[24px] w-[24px]" />
              </button>
              <button
                type="button"
                className={`text-[18px] leading-[24px] font-medium ${
                  canSubmit && !isSubmitting && !isLoadingReview && !loadError
                    ? "text-[#1a1c20]"
                    : "text-[#b0b3ba]"
                }`}
                disabled={!canSubmit || isSubmitting || isLoadingReview || !!loadError}
                onClick={() => handleSubmit()}
              >
                {isSubmitting ? "등록 중…" : reviewId !== undefined ? "수정" : "게시"}
              </button>
            </div>
          </header>
          <div className={FIXED_TOP_BAR_SPACER_CLASS} aria-hidden />
        </>

        <main className="flex flex-1 flex-col items-center px-[20px] pb-[64px] pt-[41px]">
          {isLoadingReview ? (
            <p className="text-[14px] text-[#868b94]">후기를 불러오는 중…</p>
          ) : null}
          {!isLoadingReview && loadError ? (
            <p className="text-center text-[14px] text-red-600">{loadError}</p>
          ) : null}
          <section className="flex w-[204px] flex-col items-center gap-[16px]">
            <h1 className="text-center text-[18px] leading-[24px] font-bold text-[#1a1c20]">
              후기를 작성해 보세요!
            </h1>
            <div className="flex items-center gap-[6px]">
              {Array.from({ length: 5 }).map((_, idx) => {
                const filled = idx < rating;
                return (
                  <button
                    key={idx}
                    type="button"
                    aria-label={`${idx + 1}점`}
                    className={filled ? "blue_700 text-blue-700" : "text-[#d1d3d8]"}
                    style={{
                      width: "33.66px",
                      height: "33.66px",
                      fontSize: "33.66px",
                      lineHeight: "33.66px",
                    }}
                    onClick={() => setRating(idx + 1)}
                  >
                    ★
                  </button>
                );
              })}
            </div>
          </section>

          <div className="h-[50px] w-full shrink-0" aria-hidden />

          <section className="flex h-[354px] w-full flex-col gap-[8px] rounded-[12px] border border-[#dcdee3] px-[20px] py-[16px]">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, 300))}
              placeholder="후기를 작성해주세요"
              className="min-h-[66px] flex-1 resize-none bg-transparent text-[16px] leading-[22px] text-[#1a1c20] outline-none placeholder:text-[#d1d3d8]"
            />
            <p className="text-right text-[14px] leading-[19px]">
              <span className="text-[#1a1c20]">{content.length}</span>
              <span className="text-[#b0b3ba]">/300</span>
            </p>
          </section>
        </main>
      </div>

      <div className="fixed bottom-0 left-1/2 z-40 flex h-[44px] w-full max-w-[402px] -translate-x-1/2 items-center border-t border-[#eeeff1] bg-white px-[14px] md:max-w-[744px]">
        <button
          type="button"
          className="flex h-[28px] items-center gap-[6px] rounded-[8px] border border-[#dcdee3] px-[8px]"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploadingImages}
          aria-label="이미지 업로드"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M4 7.5C4 6.11929 5.11929 5 6.5 5H17.5C18.8807 5 20 6.11929 20 7.5V16.5C20 17.8807 18.8807 19 17.5 19H6.5C5.11929 19 4 17.8807 4 16.5V7.5Z"
              stroke="#1a1c20"
              strokeWidth="1.7"
            />
            <circle cx="8.5" cy="9" r="1.5" fill="#1a1c20" />
            <path d="M7 16L11 12L14 15L16.5 12.5L19 16" stroke="#1a1c20" strokeWidth="1.7" />
          </svg>
          <span className="text-[13px] leading-[18px] font-medium text-[#1a1c20]">
            {isUploadingImages
              ? "업로드 중..."
              : `이미지${uploadedImageUrls.length ? ` (${uploadedImageUrls.length})` : ""}`}
          </span>
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

      {showExitDialog ? (
        <ConfirmExitDialog
          onExit={() => goToBakeryDetail(false)}
          onContinue={() => setShowExitDialog(false)}
        />
      ) : null}
    </MobileFrame>
  );
}
