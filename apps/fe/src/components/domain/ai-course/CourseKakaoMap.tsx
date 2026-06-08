import { useEffect, useMemo, useRef, useState } from "react";
import mapImage from "@/assets/images/map.png";
import { loadKakaoMapSdk } from "@/lib/kakaoMapSdk";
import type { KakaoLatLng, KakaoLatLngBounds, KakaoMap, KakaoMaps } from "@/types/kakao-maps";
import { cn } from "@/utils/cn";
import { getCourseOrderMarkerPalette } from "@/lib/courseOrderMarkerPalette";
import { filterValidMapPoints, type CourseMapBakery } from "./courseMapPoints";

export type { CourseMapBakery } from "./courseMapPoints";

type Props = {
  bakeries: CourseMapBakery[];
  departurePoint?: { lat: number; lng: number; label: string } | null;
  className?: string;
  /** API 조회 중 좌표가 아직 없을 때 정적 지도 대신 로딩 표시 */
  isLoading?: boolean;
};

type MapStatus = "loading" | "ready" | "fallback";

function mapPointsKey(points: CourseMapBakery[]): string {
  return points.map((b) => `${b.order}:${b.id}:${b.lat},${b.lng}`).join("|");
}

function createOrderMarkerElement(order: number, name: string): HTMLDivElement {
  const palette = getCourseOrderMarkerPalette(order);
  const wrap = document.createElement("div");
  wrap.setAttribute("role", "img");
  wrap.setAttribute("aria-label", `${order}번째 ${name}`);
  wrap.style.cssText = [
    "display:flex",
    "flex-direction:column",
    "align-items:center",
    "gap:4px",
    "pointer-events:none",
    "user-select:none",
  ].join(";");

  const badge = document.createElement("div");
  badge.textContent = String(order);
  badge.style.cssText = [
    "display:flex",
    "align-items:center",
    "justify-content:center",
    "width:28px",
    "height:28px",
    "border-radius:9999px",
    `background:${palette.background}`,
    `color:${palette.text}`,
    "font-size:14px",
    "font-weight:700",
    "line-height:1",
    "font-family:Pretendard,system-ui,sans-serif",
    `border:2px solid ${palette.border}`,
    "box-shadow:0 2px 6px rgba(15,23,42,0.24)",
    "box-sizing:border-box",
  ].join(";");

  const stem = document.createElement("div");
  stem.style.cssText = [
    "width:2px",
    "height:14px",
    `background:${palette.background}`,
    "border-radius:9999px",
    "box-shadow:0 1px 3px rgba(15,23,42,0.18)",
  ].join(";");

  const anchor = document.createElement("div");
  anchor.style.cssText = [
    "width:8px",
    "height:8px",
    "border-radius:9999px",
    `background:${palette.background}`,
    "border:2px solid #ffffff",
    "box-shadow:0 1px 4px rgba(15,23,42,0.18)",
    "box-sizing:border-box",
  ].join(";");

  wrap.appendChild(badge);
  wrap.appendChild(stem);
  wrap.appendChild(anchor);
  return wrap;
}

function createDepartureMarkerElement(label: string): HTMLDivElement {
  const wrap = document.createElement("div");
  wrap.style.cssText = [
    "display:flex",
    "flex-direction:column",
    "align-items:center",
    "gap:6px",
    "pointer-events:none",
    "user-select:none",
  ].join(";");

  const badge = document.createElement("div");
  badge.textContent = label;
  badge.style.cssText = [
    "padding:6px 10px",
    "border-radius:9999px",
    "background:#111827",
    "color:#fff",
    "font-size:12px",
    "font-weight:700",
    "line-height:1",
    "font-family:Pretendard,system-ui,sans-serif",
    "box-shadow:0 3px 10px rgba(15,23,42,0.25)",
    "white-space:nowrap",
  ].join(";");

  const dotWrap = document.createElement("div");
  dotWrap.style.cssText = [
    "display:flex",
    "align-items:center",
    "justify-content:center",
    "width:26px",
    "height:26px",
    "border-radius:9999px",
    "background:rgba(16,185,129,0.18)",
    "box-shadow:0 3px 10px rgba(15,23,42,0.15)",
    "box-sizing:border-box",
  ].join(";");

  const dot = document.createElement("div");
  dot.style.cssText = [
    "width:16px",
    "height:16px",
    "border-radius:9999px",
    "background:#10b981",
    "border:3px solid #d1fae5",
    "box-shadow:0 2px 6px rgba(15,23,42,0.25)",
    "box-sizing:border-box",
    "flex:none",
  ].join(";");

  const stem = document.createElement("div");
  stem.style.cssText = [
    "width:2px",
    "height:14px",
    "border-radius:9999px",
    "background:#9ca3af",
    "opacity:0.9",
  ].join(";");

  wrap.appendChild(badge);
  wrap.appendChild(stem);
  dotWrap.appendChild(dot);
  wrap.appendChild(dotWrap);
  return wrap;
}

function buildSimplePathPositions(
  maps: KakaoMaps,
  departurePoint: { lat: number; lng: number } | null | undefined,
  markerPositions: KakaoLatLng[],
): KakaoLatLng[] {
  const departureOverlayPosition = departurePoint
    ? new maps.LatLng(departurePoint.lat, departurePoint.lng)
    : null;

  return [...(departureOverlayPosition ? [departureOverlayPosition] : []), ...markerPositions];
}

function CourseKakaoMapView({
  mapPoints,
  departurePoint,
  className,
}: {
  mapPoints: CourseMapBakery[];
  departurePoint?: { lat: number; lng: number; label: string } | null;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<KakaoMap | null>(null);
  const boundsRef = useRef<KakaoLatLngBounds | null>(null);
  const [status, setStatus] = useState<MapStatus>("loading");

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.style.touchAction = "none";

    let cancelled = false;
    const mapObjects: Array<{ setMap: (map: null) => void }> = [];

    void (async () => {
      try {
        const kakao = await loadKakaoMapSdk();
        if (cancelled) return;

        const { maps } = kakao;
        const orderedPoints = [...mapPoints].sort((a, b) => a.order - b.order);
        const markerPositions = orderedPoints.map((b) => new maps.LatLng(b.lat, b.lng));
        const center = markerPositions[0]!;

        const map = new maps.Map(container, {
          center,
          level: mapPoints.length === 1 ? 4 : 5,
          draggable: true,
        });
        // 일부 SDK 버전은 생성자 옵션의 draggable을 무시하므로 명시적으로 활성화한다.
        map.setDraggable(true);
        map.setZoomable(true);
        mapRef.current = map;

        if (markerPositions.length > 1) {
          const departureOverlayPosition = departurePoint
            ? new maps.LatLng(departurePoint.lat, departurePoint.lng)
            : null;

          const pathPositions = buildSimplePathPositions(maps, departurePoint, markerPositions);

          mapObjects.push(
            new maps.Polyline({
              map,
              path: pathPositions,
              strokeWeight: 3,
              strokeColor: "#41454e",
              strokeOpacity: 0.85,
              strokeStyle: "shortdash",
            }),
          );

          if (departurePoint && departureOverlayPosition) {
            mapObjects.push(
              new maps.CustomOverlay({
                map,
                position: departureOverlayPosition,
                content: createDepartureMarkerElement(departurePoint.label),
                xAnchor: 0.5,
                yAnchor: 1.7,
                zIndex: 3000,
              }),
            );
          }

          for (const point of orderedPoints) {
            const overlayPosition = new maps.LatLng(point.lat, point.lng);
            mapObjects.push(
              new maps.CustomOverlay({
                map,
                position: overlayPosition,
                content: createOrderMarkerElement(point.order, point.name),
                xAnchor: 0.5,
                yAnchor: 1.55,
                zIndex: 2000 + point.order,
              }),
            );
          }

          const bounds = new maps.LatLngBounds();
          if (departureOverlayPosition) {
            bounds.extend(departureOverlayPosition);
          }
          for (const point of orderedPoints) {
            bounds.extend(new maps.LatLng(point.lat, point.lng));
          }
          for (const position of pathPositions) {
            bounds.extend(position);
          }
          boundsRef.current = bounds;
          map.setBounds(bounds);
        } else {
          if (departurePoint) {
            mapObjects.push(
              new maps.CustomOverlay({
                map,
                position: new maps.LatLng(departurePoint.lat, departurePoint.lng),
                content: createDepartureMarkerElement(departurePoint.label),
                xAnchor: 0.5,
                yAnchor: 1.7,
                zIndex: 3000,
              }),
            );
          }

          for (const point of orderedPoints) {
            const position = new maps.LatLng(point.lat, point.lng);
            mapObjects.push(
              new maps.CustomOverlay({
                map,
                position,
                content: createOrderMarkerElement(point.order, point.name),
                xAnchor: 0.5,
                yAnchor: 1.55,
                zIndex: 2000 + point.order,
              }),
            );
          }

          if (departurePoint) {
            const bounds = new maps.LatLngBounds();
            bounds.extend(new maps.LatLng(departurePoint.lat, departurePoint.lng));
            bounds.extend(center);
            boundsRef.current = bounds;
            map.setBounds(bounds);
          } else {
            boundsRef.current = null;
          }
        }

        if (!cancelled) setStatus("ready");
      } catch {
        if (!cancelled) setStatus("fallback");
      }
    })();

    return () => {
      cancelled = true;
      mapRef.current = null;
      boundsRef.current = null;
      for (const mapObject of mapObjects) {
        mapObject.setMap(null);
      }
      container.replaceChildren();
    };
  }, [departurePoint, mapPoints]);

  useEffect(() => {
    if (status !== "ready") return;
    const container = containerRef.current;
    const map = mapRef.current;
    if (!container || !map) return;

    const fitMapToContainer = () => {
      map.relayout();
      const bounds = boundsRef.current;
      if (bounds) {
        map.setBounds(bounds);
      }
    };

    const observer = new ResizeObserver(() => {
      fitMapToContainer();
    });
    observer.observe(container);
    fitMapToContainer();

    return () => observer.disconnect();
  }, [status]);

  if (status === "fallback") {
    return (
      <img src={mapImage} alt="코스 지도" className={cn("h-full w-full object-cover", className)} />
    );
  }

  return (
    <div className={cn("relative h-full w-full", className)}>
      <div ref={containerRef} className="h-full w-full" aria-label="AI 추천 코스 지도" />
      {status === "loading" ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-gray-100 text-size-3 text-gray-500">
          지도 불러오는 중…
        </div>
      ) : null}
    </div>
  );
}

function MapLoadingPlaceholder({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center bg-gray-100 text-size-3 text-gray-500",
        className,
      )}
    >
      지도 불러오는 중…
    </div>
  );
}

export default function CourseKakaoMap({
  bakeries,
  departurePoint,
  className,
  isLoading = false,
}: Props) {
  const mapPoints = useMemo(() => filterValidMapPoints(bakeries), [bakeries]);

  if (mapPoints.length === 0) {
    if (isLoading) {
      return <MapLoadingPlaceholder className={className} />;
    }
    return (
      <img src={mapImage} alt="코스 지도" className={cn("h-full w-full object-cover", className)} />
    );
  }

  return (
    <CourseKakaoMapView
      key={mapPointsKey(mapPoints)}
      mapPoints={mapPoints}
      departurePoint={departurePoint}
      className={className}
    />
  );
}
