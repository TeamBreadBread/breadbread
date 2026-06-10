import { useCallback, useEffect, useState } from "react";
import { getErrorMessage } from "@/api/types/common";
import { getMyReviews, type MyReviewItem } from "@/api/user";
import { AppTopBar } from "@/components/common";
import BottomNav from "@/components/layout/BottomNav";
import MobileFrame from "@/components/layout/MobileFrame";
import { useNavigate } from "@tanstack/react-router";

import { buildBbakeryDetailSearch } from "@/utils/bakeryListEntry";

const PAGE_SIZE = 10;

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export default function MyReviewsPage() {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<MyReviewItem[]>([]);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const loadPage = useCallback(async (nextPage: number, append: boolean) => {
    try {
      setError("");
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }
      const data = await getMyReviews({ page: nextPage, size: PAGE_SIZE });
      setReviews((prev) => (append ? [...prev, ...data.reviews] : data.reviews));
      setPage(data.page);
      setHasNext(data.hasNext);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    void loadPage(0, false);
  }, [loadPage]);

  return (
    <MobileFrame>
      <div className="flex flex-1 flex-col bg-[#f3f4f5]">
        <AppTopBar
          title="내가 쓴 리뷰"
          centered
          showBackButton
          onBackClick={() => navigate({ to: "/my" })}
        />

        <main className="flex flex-1 flex-col gap-x4 px-x5 py-x6 pb-[calc(56px+24px)] sm:pb-[calc(72px+24px)]">
          {isLoading ? (
            <p className="typo-t4regular text-gray-700">리뷰를 불러오는 중이에요.</p>
          ) : null}
          {error ? (
            <p className="typo-t4regular text-[color:var(--color-red-700)]">{error}</p>
          ) : null}
          {!isLoading && !error && reviews.length === 0 ? (
            <div className="rounded-r4 bg-white px-x5 py-x6">
              <p className="typo-t4medium text-gray-1000">아직 작성한 리뷰가 없어요.</p>
            </div>
          ) : null}

          {reviews.map((review) => (
            <button
              key={review.reviewId}
              type="button"
              onClick={() =>
                navigate({
                  to: "/bbangteo-bakery-detail",
                  search: buildBbakeryDetailSearch({
                    bakeryId: review.bakeryId,
                    reviewTab: true,
                  }),
                })
              }
              className="rounded-r4 bg-white px-x5 py-x5 text-left"
            >
              <div className="flex items-start justify-between gap-x3">
                <div>
                  <p className="typo-t4bold text-gray-1000">{review.bakeryName}</p>
                  <p className="mt-x1 typo-t3regular text-gray-700">
                    {formatDate(review.createdAt)}
                  </p>
                </div>
                <span className="rounded-full bg-[#fff4da] px-x3 py-x1 typo-t3medium text-[#9a5a00]">
                  평점 {review.rating.toFixed(1)}
                </span>
              </div>

              <p className="mt-x4 typo-t4regular text-gray-1000">{review.content}</p>
              {review.imageUrls.length > 0 ? (
                <p className="mt-x3 typo-t3regular text-gray-700">
                  첨부 이미지 {review.imageUrls.length}장
                </p>
              ) : null}
            </button>
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
