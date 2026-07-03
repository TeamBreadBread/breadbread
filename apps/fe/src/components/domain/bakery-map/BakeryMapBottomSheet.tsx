import handleArrow from "@/assets/icons/handle_arrowup.png";
import type { BakeryMapPoint } from "@/components/domain/bakery-map/types";
import { AppIcon, IconAssets } from "@/components/icons";
import {
  formatBakeryRating,
  resolveBakeryRating,
  resolveBakeryReviewCount,
  shouldShowBakeryRating,
} from "@/utils/bakeryRating";
import { cn } from "@/utils/cn";

type BakeryMapBottomSheetProps = {
  sheetRef: React.RefObject<HTMLElement | null>;
  contentRef: React.RefObject<HTMLDivElement | null>;
  sheetTopY: number;
  isDragging: boolean;
  isFullSheet: boolean;
  items: BakeryMapPoint[];
  selectedBakeryId: number | null;
  onSelectBakery: (bakeryId: number) => void;
  onItemClick: (bakery: BakeryMapPoint) => void;
  onHandlePointerDown: (clientY: number) => void;
  onTogglePhase: () => void;
  emptyMessage?: string;
};

function BakeryMapSheetRow({
  bakery,
  selected,
  onSelect,
  onClick,
}: {
  bakery: BakeryMapPoint;
  selected: boolean;
  onSelect: () => void;
  onClick: () => void;
}) {
  const reviewCount = resolveBakeryReviewCount(bakery.reviewCount);
  const rating = resolveBakeryRating(bakery.rating);
  const showRating = shouldShowBakeryRating(reviewCount);

  return (
    <button
      type="button"
      data-bakery-map-sheet-item={bakery.id}
      onClick={() => {
        onSelect();
        onClick();
      }}
      className={cn(
        "flex w-full flex-col gap-x1 border-b border-gray-200 px-x5 py-x4 text-left",
        selected && "bg-orange-100/60",
      )}
    >
      <p className="line-clamp-1 font-pretendard text-size-4 font-medium leading-t5 text-gray-1000">
        {bakery.name}
      </p>
      <p className="line-clamp-1 font-pretendard text-size-2 leading-t3 text-gray-700">
        {bakery.address}
      </p>
      <div className="flex items-center gap-x2">
        {showRating ? (
          <div className="flex items-center gap-x0-5">
            <AppIcon src={IconAssets.IcStar} size={14} className="icon-orange-600" alt="" />
            <span className="font-pretendard text-size-2 leading-t3 text-gray-700">
              {formatBakeryRating(rating)}
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
    </button>
  );
}

export default function BakeryMapBottomSheet({
  sheetRef,
  contentRef,
  sheetTopY,
  isDragging,
  isFullSheet,
  items,
  selectedBakeryId,
  onSelectBakery,
  onItemClick,
  onHandlePointerDown,
  onTogglePhase,
  emptyMessage = "이 지도 영역에 표시할 빵집이 없어요.",
}: BakeryMapBottomSheetProps) {
  return (
    <aside
      ref={sheetRef}
      className={cn(
        "absolute inset-x-0 z-20 overflow-hidden rounded-t-r5 bg-white shadow-[0_-4px_16px_rgba(0,0,0,0.08)]",
        !isDragging && "transition-[top] duration-300 ease-out",
      )}
      style={{ top: sheetTopY, bottom: 0 }}
    >
      <div
        className="flex justify-center py-[14px]"
        onMouseDown={(event) => onHandlePointerDown(event.clientY)}
        onTouchStart={(event) => {
          const touch = event.touches[0];
          if (touch) onHandlePointerDown(touch.clientY);
        }}
      >
        <button
          type="button"
          data-bakery-map-sheet-handle="true"
          aria-label="바텀시트 핸들"
          aria-expanded={isFullSheet}
          onClick={onTogglePhase}
          className="flex h-x6 w-x16 items-center justify-center rounded-full bg-white outline-none"
        >
          <img
            src={handleArrow}
            alt=""
            className={cn(
              "h-[9px] w-[47px] object-contain transition-transform duration-300 ease-out",
              isFullSheet ? "rotate-0" : "rotate-180",
            )}
            aria-hidden
          />
        </button>
      </div>

      <div
        ref={contentRef}
        className="sheet-scrollbar h-[calc(100%-24px)] overflow-y-auto pb-[calc(72px+env(safe-area-inset-bottom))]"
      >
        {items.length === 0 ? (
          <p className="px-x5 py-x8 text-center font-pretendard text-size-3 text-gray-700">
            {emptyMessage}
          </p>
        ) : (
          items.map((bakery) => (
            <BakeryMapSheetRow
              key={bakery.id}
              bakery={bakery}
              selected={bakery.id === selectedBakeryId}
              onSelect={() => onSelectBakery(bakery.id)}
              onClick={() => onItemClick(bakery)}
            />
          ))
        )}
      </div>
    </aside>
  );
}
