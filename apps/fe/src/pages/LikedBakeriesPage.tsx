import { useCallback, useEffect, useState } from "react";
import { getErrorMessage } from "@/api/types/common";
import { getLikedBakeries, type LikedBakeriesResponse } from "@/api/user";
import { AppTopBar } from "@/components/common";
import BottomNav from "@/components/layout/BottomNav";
import MobileFrame from "@/components/layout/MobileFrame";
import { useNavigate } from "@tanstack/react-router";
import { resolveThumbnailDongAddress } from "@/utils/formatCurationAddress";

const PAGE_SIZE = 10;

export default function LikedBakeriesPage() {
  const navigate = useNavigate();
  const [response, setResponse] = useState<LikedBakeriesResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const loadPage = useCallback(async (page: number, append: boolean) => {
    try {
      setError("");
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }
      const data = await getLikedBakeries({ page, size: PAGE_SIZE });
      setResponse((prev) => {
        if (!append || !prev) return data;
        return {
          ...data,
          bakeries: [...prev.bakeries, ...data.bakeries],
        };
      });
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

  const bakeries = response?.bakeries ?? [];

  return (
    <MobileFrame>
      <div className="flex flex-1 flex-col bg-[#f3f4f5]">
        <AppTopBar
          title="좋아요한 빵집"
          centered
          showBackButton
          onBackClick={() => navigate({ to: "/my" })}
        />

        <main className="flex flex-1 flex-col gap-x4 px-x5 py-x6 pb-[calc(56px+24px)] sm:pb-[calc(72px+24px)]">
          {isLoading ? (
            <p className="typo-t4regular text-gray-700">빵집을 불러오는 중이에요.</p>
          ) : null}
          {error ? (
            <p className="typo-t4regular text-[color:var(--color-red-700)]">{error}</p>
          ) : null}
          {!isLoading && !error && bakeries.length === 0 ? (
            <div className="rounded-r4 bg-white px-x5 py-x6">
              <p className="typo-t4medium text-gray-1000">아직 좋아요한 빵집이 없어요.</p>
            </div>
          ) : null}

          {bakeries.map((bakery) => (
            <button
              key={bakery.id}
              type="button"
              className="rounded-r4 bg-white px-x5 py-x5 text-left"
              onClick={() =>
                navigate({
                  to: "/bbangteo-bakery-detail",
                  search: {
                    bakeryId: bakery.id,
                    from: undefined,
                    courseId: undefined,
                    reviewUploaded: undefined,
                    reviewTab: undefined,
                  },
                })
              }
            >
              <div className="flex items-start justify-between gap-x3">
                <div>
                  <p className="typo-t4bold text-gray-1000">{bakery.name}</p>
                  <p className="mt-x1 typo-t3regular text-gray-700">
                    {resolveThumbnailDongAddress(bakery.address, bakery.dong, bakery.name)}
                  </p>
                </div>
                <span className="rounded-full bg-[#fff4da] px-x3 py-x1 typo-t3medium text-[#9a5a00]">
                  평점 {Number(bakery.rating ?? 0).toFixed(1)}
                </span>
              </div>

              <p className="mt-x4 typo-t3regular text-gray-700">
                좋아요 {bakery.likeCount ?? 0} · {bakery.openTime ?? "--:--"} ~{" "}
                {bakery.closeTime ?? "--:--"}
              </p>
            </button>
          ))}

          {response?.hasNext ? (
            <button
              type="button"
              className="rounded-r3 border border-gray-300 bg-white px-x5 py-x4 typo-t4bold text-gray-1000 disabled:opacity-50"
              disabled={isLoadingMore}
              onClick={() => void loadPage((response?.page ?? 0) + 1, true)}
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
