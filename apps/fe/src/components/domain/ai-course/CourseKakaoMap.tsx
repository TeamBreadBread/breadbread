import { useEffect, useMemo, useRef, useState } from "react";
import mapImage from "@/assets/images/map.png";
import { loadKakaoMapSdk } from "@/lib/kakaoMapSdk";
import type { KakaoLatLng, KakaoLatLngBounds, KakaoMap, KakaoMaps } from "@/types/kakao-maps";
import { cn } from "@/utils/cn";
import { getCourseOrderMarkerPalette } from "@/lib/courseOrderMarkerPalette";
import { filterValidMapPoints, type CourseMapBakery } from "./courseMapPoints";

export type { CourseMapBakery } from "./courseMapPoints";

export type CourseMapBoundsPadding = {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
};

type Props = {
  bakeries: CourseMapBakery[];
  departurePoint?: { lat: number; lng: number; label: string } | null;
  className?: string;
  /** API 조회 중 좌표가 아직 없을 때 정적 지도 대신 로딩 표시 */
  isLoading?: boolean;
  /** BE directions API 경로 — 있으면 실선 polyline, 없으면 점선 직선 연결 */
  routePath?: Array<{ lat: number; lng: number }> | null;
  /** 경로 API 조회 중 */
  routeLoading?: boolean;
  /** true면 API 경로가 올 때까지 점선 폴백을 그리지 않음 */
  expectRoutePath?: boolean;
  /** 지도 영역 높이 변경 시 relayout만 수행 (fitBounds 재실행 없음) */
  layoutKey?: string | number;
  /** fitBounds 여백 — 하단 시트 등 UI 가림 방지 */
  boundsPadding?: CourseMapBoundsPadding;
};

type MapStatus = "loading" | "ready" | "fallback";

const DEFAULT_BOUNDS_PADDING: Required<CourseMapBoundsPadding> = {
  top: 48,
  right: 48,
  bottom: 48,
  left: 48,
};

function resolveBoundsPadding(padding?: CourseMapBoundsPadding): Required<CourseMapBoundsPadding> {
  return {
    top: padding?.top ?? DEFAULT_BOUNDS_PADDING.top,
    right: padding?.right ?? DEFAULT_BOUNDS_PADDING.right,
    bottom: padding?.bottom ?? DEFAULT_BOUNDS_PADDING.bottom,
    left: padding?.left ?? DEFAULT_BOUNDS_PADDING.left,
  };
}

function buildCourseMapBounds(
  maps: KakaoMaps,
  orderedPoints: CourseMapBakery[],
  departurePoint: { lat: number; lng: number } | null | undefined,
  pathPositions: KakaoLatLng[] = [],
): KakaoLatLngBounds | null {
  const bounds = new maps.LatLngBounds();
  let hasPoint = false;

  const extend = (lat: number, lng: number) => {
    bounds.extend(new maps.LatLng(lat, lng));
    hasPoint = true;
  };

  if (departurePoint) {
    extend(departurePoint.lat, departurePoint.lng);
  }

  for (const point of orderedPoints) {
    extend(point.lat, point.lng);
  }

  for (const position of pathPositions) {
    bounds.extend(position);
    hasPoint = true;
  }

  return hasPoint ? bounds : null;
}

function mapPointsKey(points: CourseMapBakery[]): string {
  return points.map((b) => `${b.order}:${b.id}:${b.lat},${b.lng}`).join("|");
}

function routePathKey(routePath?: Array<{ lat: number; lng: number }> | null): string {
  if (!routePath || routePath.length === 0) return "none";
  const first = routePath[0]!;
  const last = routePath[routePath.length - 1]!;
  return `${routePath.length}:${first.lat},${first.lng}->${last.lat},${last.lng}`;
}

function courseBoundsKey(pointsKey: string, departureKey: string): string {
  return `${pointsKey}::${departureKey}`;
}

/** CustomOverlay yAnchor — 콘텐츠 하단(좌표 핀)이 lat/lng에 맞도록 */
const ORDER_MARKER_Y_ANCHOR = 1;
const DEPARTURE_MARKER_Y_ANCHOR = 1;

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
  layoutKey,
  boundsPadding,
  routePath,
  expectRoutePath = false,
}: {
  mapPoints: CourseMapBakery[];
  departurePoint?: { lat: number; lng: number; label: string } | null;
  className?: string;
  layoutKey?: string | number;
  boundsPadding?: CourseMapBoundsPadding;
  routePath?: Array<{ lat: number; lng: number }> | null;
  expectRoutePath?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<KakaoMap | null>(null);
  const boundsRef = useRef<KakaoLatLngBounds | null>(null);
  const userHasMovedMapRef = useRef(false);
  const isProgrammaticFitRef = useRef(false);
  const lastFittedBoundsKeyRef = useRef<string | null>(null);
  const [status, setStatus] = useState<MapStatus>("loading");

  const pointsKey = mapPointsKey(mapPoints);
  const departureKey = departurePoint
    ? `${departurePoint.lat.toFixed(6)},${departurePoint.lng.toFixed(6)},${departurePoint.label}`
    : "none";
  const pathKey = routePathKey(routePath);
  const boundsKey = `${courseBoundsKey(pointsKey, departureKey)}::${pathKey}`;
  const resolvedPadding = resolveBoundsPadding(boundsPadding);

  useEffect(() => {
    userHasMovedMapRef.current = false;
    lastFittedBoundsKeyRef.current = null;

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
        const resolvedRoutePositions =
          routePath && routePath.length >= 2
            ? routePath.map((point) => new maps.LatLng(point.lat, point.lng))
            : null;
        const shouldUseFallbackPath = !expectRoutePath || resolvedRoutePositions != null;
        const pathPositions =
          resolvedRoutePositions ??
          (shouldUseFallbackPath
            ? buildSimplePathPositions(maps, departurePoint, markerPositions)
            : []);
        const center = markerPositions[0] ?? pathPositions[0];
        if (!center) {
          if (!cancelled) setStatus("fallback");
          return;
        }

        const map = new maps.Map(container, {
          center,
          level: orderedPoints.length === 1 ? 4 : 5,
          draggable: true,
        });
        map.setDraggable(true);
        map.setZoomable(true);
        mapRef.current = map;

        if (typeof map.addListener === "function") {
          map.addListener("dragstart", () => {
            if (!isProgrammaticFitRef.current) {
              userHasMovedMapRef.current = true;
            }
          });
          map.addListener("zoom_changed", () => {
            if (!isProgrammaticFitRef.current) {
              userHasMovedMapRef.current = true;
            }
          });
        }

        const departureOverlayPosition = departurePoint
          ? new maps.LatLng(departurePoint.lat, departurePoint.lng)
          : null;

        if (pathPositions.length > 1) {
          mapObjects.push(
            new maps.Polyline({
              map,
              path: pathPositions,
              strokeWeight: resolvedRoutePositions ? 4 : 3,
              strokeColor: "#41454e",
              strokeOpacity: resolvedRoutePositions ? 0.92 : 0.85,
              strokeStyle: resolvedRoutePositions ? "solid" : "shortdash",
            }),
          );
        }

        if (departurePoint && departureOverlayPosition) {
          mapObjects.push(
            new maps.CustomOverlay({
              map,
              position: departureOverlayPosition,
              content: createDepartureMarkerElement(departurePoint.label),
              xAnchor: 0.5,
              yAnchor: DEPARTURE_MARKER_Y_ANCHOR,
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
              yAnchor: ORDER_MARKER_Y_ANCHOR,
              zIndex: 2000 + point.order,
            }),
          );
        }

        boundsRef.current = buildCourseMapBounds(
          maps,
          orderedPoints,
          departurePoint,
          pathPositions,
        );

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
      setStatus("loading");
    };
    // departureKey·pointsKey·pathKey가 mapPoints·departurePoint·routePath 변경을 대표합니다.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed deps avoid map re-init on referential churn
  }, [departureKey, pathKey, pointsKey]);

  useEffect(() => {
    if (status !== "ready") return;

    const map = mapRef.current;
    const bounds = boundsRef.current;
    const container = containerRef.current;
    if (!map || !bounds || !container) return;

    if (lastFittedBoundsKeyRef.current === boundsKey) return;
    if (userHasMovedMapRef.current) return;

    let disposed = false;

    const applyFitBounds = (): boolean => {
      if (disposed || userHasMovedMapRef.current) return false;
      if (lastFittedBoundsKeyRef.current === boundsKey) return true;

      const { clientWidth, clientHeight } = container;
      if (clientWidth < 16 || clientHeight < 16) return false;

      isProgrammaticFitRef.current = true;
      map.relayout();
      map.setBounds(
        bounds,
        resolvedPadding.top,
        resolvedPadding.right,
        resolvedPadding.bottom,
        resolvedPadding.left,
      );
      lastFittedBoundsKeyRef.current = boundsKey;

      window.requestAnimationFrame(() => {
        isProgrammaticFitRef.current = false;
      });

      return true;
    };

    if (applyFitBounds()) return;

    const observer = new ResizeObserver(() => {
      if (applyFitBounds()) {
        observer.disconnect();
      }
    });
    observer.observe(container);

    const rafId = window.requestAnimationFrame(() => {
      if (applyFitBounds()) {
        observer.disconnect();
      }
    });

    const timeoutId = window.setTimeout(() => {
      applyFitBounds();
      observer.disconnect();
    }, 180);

    return () => {
      disposed = true;
      observer.disconnect();
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(timeoutId);
    };
  }, [
    status,
    boundsKey,
    resolvedPadding.bottom,
    resolvedPadding.left,
    resolvedPadding.right,
    resolvedPadding.top,
  ]);

  useEffect(() => {
    if (status !== "ready") return;
    const map = mapRef.current;
    const container = containerRef.current;
    if (!map || !container) return;

    const observer = new ResizeObserver(() => {
      map.relayout();
    });
    observer.observe(container);
    map.relayout();

    return () => {
      observer.disconnect();
    };
  }, [status, layoutKey]);

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
  routePath = null,
  routeLoading = false,
  expectRoutePath = false,
  layoutKey,
  boundsPadding,
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
    <div className={cn("relative h-full w-full", className)}>
      <CourseKakaoMapView
        key={`${mapPointsKey(mapPoints)}::${routePathKey(routePath)}`}
        mapPoints={mapPoints}
        departurePoint={departurePoint}
        className="h-full w-full"
        layoutKey={layoutKey}
        boundsPadding={boundsPadding}
        routePath={routePath}
        expectRoutePath={expectRoutePath}
      />
      {isLoading || routeLoading ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-gray-100/60 text-size-3 text-gray-500">
          {routeLoading ? "경로 불러오는 중…" : "지도 불러오는 중…"}
        </div>
      ) : null}
    </div>
  );
}
