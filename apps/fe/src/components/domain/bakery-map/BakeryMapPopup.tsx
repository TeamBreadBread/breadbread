import { SafeImage } from "@/components/common/SafeImage";
import { AppIcon, IconAssets } from "@/components/icons";
import type { BakeryMapPoint } from "@/components/domain/bakery-map/types";
import { isListItemOpenNow } from "@/utils/bakeryBusinessHours";
import {
  formatBakeryRating,
  resolveBakeryRating,
  resolveBakeryReviewCount,
  shouldShowBakeryRating,
} from "@/utils/bakeryRating";
import { cn } from "@/utils/cn";
import currationBreadImg from "@/assets/images/Curration_CardBread.png";

type BakeryMapPopupProps = {
  bakery: BakeryMapPoint;
  onClick: () => void;
  className?: string;
};

export default function BakeryMapPopup({ bakery, onClick, className }: BakeryMapPopupProps) {
  const imageUrl = bakery.images[0];
  const reviewCount = resolveBakeryReviewCount(bakery.reviewCount);
  const rating = resolveBakeryRating(bakery.rating);
  const showRating = shouldShowBakeryRating(reviewCount);
  const isOpen = isListItemOpenNow(bakery);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-stretch gap-x3 rounded-r3 border border-gray-300 bg-gray-00 p-x3 text-left shadow-3",
        className,
      )}
    >
      <div className="h-[72px] w-[72px] shrink-0 overflow-hidden rounded-r2 bg-gray-100">
        {imageUrl ? (
          <SafeImage src={imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <img src={currationBreadImg} alt="" className="h-[28px] w-[29px] opacity-60" />
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-x1">
        <div className="flex items-start justify-between gap-x2">
          <p className="line-clamp-1 font-pretendard text-size-4 font-bold leading-t5 text-gray-1000">
            {bakery.name}
          </p>
          <span
            className={cn(
              "shrink-0 rounded-full px-x2 py-x0-5 font-pretendard text-size-1 font-medium leading-t2",
              isOpen ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-700",
            )}
          >
            {isOpen ? "영업 중" : "영업 종료"}
          </span>
        </div>
        <p className="line-clamp-1 font-pretendard text-size-2 leading-t3 text-gray-700">
          {bakery.address}
        </p>
        <div className="flex items-center gap-x2">
          {showRating ? (
            <div className="flex items-center gap-x0-5">
              <AppIcon src={IconAssets.IcStar} size={14} className="icon-orange-600" alt="" />
              <span className="font-pretendard text-size-2 leading-t3 text-gray-700">
                {formatBakeryRating(rating)} ({reviewCount.toLocaleString()})
              </span>
            </div>
          ) : null}
          <div className="flex items-center gap-x0-5">
            <AppIcon
              src={IconAssets.IcHeart}
              size={14}
              className={cn("shrink-0", bakery.liked ? "icon-orange-600" : "icon-gray-600")}
              alt=""
            />
            <span className="font-pretendard text-size-2 leading-t3 text-gray-700">
              {bakery.bookmarkCount}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}
