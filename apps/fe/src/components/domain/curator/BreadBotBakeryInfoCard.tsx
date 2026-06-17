import { useEffect, useState } from "react";
import { getBakeryById } from "@/api/bakery";
import type { BakeryDetail } from "@/api/types/bakery";
import { buildWeeklyHoursRows } from "@/utils/bakeryBusinessHours";
import { resolveBakeryReviewCount, shouldShowBakeryRating } from "@/utils/bakeryRating";

type BreadBotBakeryInfoCardProps = {
  bakeryId: number;
};

function formatRating(rating?: number | null): string {
  if (rating == null || !Number.isFinite(rating)) return "평점 정보 없음";
  return `${rating.toFixed(1)}점`;
}

export default function BreadBotBakeryInfoCard({ bakeryId }: BreadBotBakeryInfoCardProps) {
  const [detail, setDetail] = useState<BakeryDetail | null>(null);
  const [resolvedBakeryId, setResolvedBakeryId] = useState<number | null>(null);
  const loading = resolvedBakeryId !== bakeryId;
  const displayDetail = resolvedBakeryId === bakeryId ? detail : null;

  useEffect(() => {
    let cancelled = false;

    void getBakeryById(bakeryId)
      .then((response) => {
        if (!cancelled) {
          setDetail(response);
          setResolvedBakeryId(bakeryId);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDetail(null);
          setResolvedBakeryId(bakeryId);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [bakeryId]);

  if (loading) {
    return (
      <div className="rounded-r3 bg-gray-100 px-x4 py-x3 font-pretendard text-size-2 text-gray-600">
        빵집 정보를 불러오는 중…
      </div>
    );
  }

  if (!displayDetail) {
    return (
      <div className="rounded-r3 bg-gray-100 px-x4 py-x3 font-pretendard text-size-2 text-gray-600">
        빵집 정보를 불러오지 못했어요.
      </div>
    );
  }

  const thumbnail = displayDetail.imageUrls?.[0];
  const hoursRows = buildWeeklyHoursRows(displayDetail);
  const todayHours = hoursRows.find((row) => row.isToday)?.text ?? "영업시간 정보 없음";
  const signatureMenus = displayDetail.breads
    .filter((bread) => bread.signature)
    .slice(0, 3)
    .map((bread) => bread.name)
    .join(", ");

  return (
    <div className="overflow-hidden rounded-r4 bg-gray-100">
      {thumbnail ? (
        <img src={thumbnail} alt="" className="h-[120px] w-full object-cover" />
      ) : (
        <div className="flex h-[120px] items-center justify-center bg-gray-200 font-pretendard text-size-2 text-gray-500">
          이미지 없음
        </div>
      )}

      <div className="space-y-x2 px-x4 py-x3">
        <div>
          <p className="font-pretendard text-size-4 font-bold leading-t5 text-gray-1000">
            {displayDetail.name}
          </p>
          <p className="mt-x1 font-pretendard text-size-2 leading-t3 text-gray-700">
            {displayDetail.address}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-x2 gap-y-x1">
          {shouldShowBakeryRating(resolveBakeryReviewCount(displayDetail.reviewCount)) ? (
            <span className="font-pretendard text-size-2 text-gray-800">
              {formatRating(displayDetail.rating)}
            </span>
          ) : null}
          {displayDetail.reviewCount != null && displayDetail.reviewCount > 0 ? (
            <span className="font-pretendard text-size-2 text-gray-600">
              후기 {displayDetail.reviewCount.toLocaleString("ko-KR")}개
            </span>
          ) : null}
        </div>

        <p className="font-pretendard text-size-2 leading-t3 text-gray-700">오늘 {todayHours}</p>

        {signatureMenus ? (
          <p className="font-pretendard text-size-2 leading-t3 text-gray-800">
            대표 메뉴 · {signatureMenus}
          </p>
        ) : null}
      </div>
    </div>
  );
}
