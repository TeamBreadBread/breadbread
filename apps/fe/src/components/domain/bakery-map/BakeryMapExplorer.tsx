import { useCallback, useEffect, useMemo, useState } from "react";
import BakeryMapBottomSheet from "@/components/domain/bakery-map/BakeryMapBottomSheet";
import BakeryMapPopup from "@/components/domain/bakery-map/BakeryMapPopup";
import BakeryMapView from "@/components/domain/bakery-map/BakeryMapView";
import {
  filterPointsInBounds,
  type BakeryMapRowLike,
  mapRowsToBakeryPoints,
} from "@/components/domain/bakery-map/bakeryMapUtils";
import CurrentLocationButton from "@/components/domain/bakery-map/CurrentLocationButton";
import type {
  BakeryMapBounds,
  BakeryMapLocationState,
  BakeryMapPoint,
} from "@/components/domain/bakery-map/types";
import { useBakeryMapBottomSheet } from "@/hooks/useBakeryMapBottomSheet";
import { cn } from "@/utils/cn";

type BakeryMapExplorerProps = {
  rows: BakeryMapRowLike[];
  loading?: boolean;
  mapCenter: BakeryMapLocationState;
  locationLoading?: boolean;
  permissionDenied?: boolean;
  onRecenter: () => void;
  selectedBakeryId: number | null;
  onSelectedBakeryIdChange: (bakeryId: number | null) => void;
  onBakeryDetail: (bakery: BakeryMapPoint) => void;
  className?: string;
};

export default function BakeryMapExplorer({
  rows,
  loading = false,
  mapCenter,
  locationLoading = false,
  permissionDenied = false,
  onRecenter,
  selectedBakeryId,
  onSelectedBakeryIdChange,
  onBakeryDetail,
  className,
}: BakeryMapExplorerProps) {
  const {
    sheetRef,
    contentRef,
    sheetTopY,
    mapHeightPx,
    isDragging,
    isFullSheet,
    togglePhase,
    onHandlePointerDown,
  } = useBakeryMapBottomSheet();

  const [mapBounds, setMapBounds] = useState<BakeryMapBounds | null>(null);
  const [popupBakeryId, setPopupBakeryId] = useState<number | null>(null);

  const allPoints = useMemo(() => mapRowsToBakeryPoints(rows), [rows]);
  const visiblePoints = useMemo(
    () => filterPointsInBounds(allPoints, mapBounds),
    [allPoints, mapBounds],
  );

  const selectedBakery = useMemo(() => {
    const id = popupBakeryId ?? selectedBakeryId;
    if (id == null) return null;
    return allPoints.find((point) => point.id === id) ?? null;
  }, [allPoints, popupBakeryId, selectedBakeryId]);

  const handleSelectBakery = useCallback(
    (bakeryId: number) => {
      onSelectedBakeryIdChange(bakeryId);
      setPopupBakeryId(bakeryId);
    },
    [onSelectedBakeryIdChange],
  );

  const handleBoundsChange = useCallback((bounds: BakeryMapBounds) => {
    setMapBounds(bounds);
  }, []);

  useEffect(() => {
    if (selectedBakeryId == null) return;
    const el = contentRef.current?.querySelector(
      `[data-bakery-map-sheet-item="${selectedBakeryId}"]`,
    );
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [contentRef, selectedBakeryId, visiblePoints.length]);

  const showEmpty = !loading && !locationLoading && allPoints.length === 0;
  const showMapLoading = loading || locationLoading;

  return (
    <div className={cn("relative flex-1", className)}>
      <div
        className="absolute inset-x-0 top-0 z-[1] overflow-hidden bg-gray-100"
        style={{
          height: mapHeightPx,
          transition: isDragging ? "none" : "height 300ms ease-out",
        }}
      >
        {showMapLoading ? (
          <div className="flex h-full items-center justify-center font-pretendard text-size-3 text-gray-700">
            {locationLoading ? "현재 위치 확인 중…" : "빵집 불러오는 중…"}
          </div>
        ) : showEmpty ? (
          <div className="flex h-full flex-col items-center justify-center gap-x2 px-x5 text-center font-pretendard text-size-3 text-gray-700">
            <p>지도에 표시할 위치 정보가 있는 빵집이 없어요.</p>
            {permissionDenied ? (
              <p className="text-size-2 text-gray-600">대전역 기준으로 표시합니다.</p>
            ) : null}
          </div>
        ) : (
          <BakeryMapView
            bakeries={allPoints}
            center={mapCenter}
            selectedBakeryId={selectedBakeryId}
            onSelectBakery={handleSelectBakery}
            onBoundsChange={handleBoundsChange}
            layoutKey={mapHeightPx}
            className="h-full w-full"
          />
        )}

        <CurrentLocationButton
          onClick={onRecenter}
          disabled={locationLoading}
          className="absolute bottom-x4 right-x4 z-[2]"
        />
      </div>

      {selectedBakery && !isFullSheet ? (
        <div
          className="pointer-events-none absolute inset-x-0 z-[15] px-x4"
          style={{ top: Math.max(72, sheetTopY - 108) }}
        >
          <div className="pointer-events-auto mx-auto max-w-[402px]">
            <BakeryMapPopup
              bakery={selectedBakery}
              onClick={() => onBakeryDetail(selectedBakery)}
            />
          </div>
        </div>
      ) : null}

      <BakeryMapBottomSheet
        sheetRef={sheetRef}
        contentRef={contentRef}
        sheetTopY={sheetTopY}
        isDragging={isDragging}
        isFullSheet={isFullSheet}
        items={visiblePoints}
        selectedBakeryId={selectedBakeryId}
        onSelectBakery={handleSelectBakery}
        onItemClick={onBakeryDetail}
        onHandlePointerDown={onHandlePointerDown}
        onTogglePhase={togglePhase}
      />
    </div>
  );
}
