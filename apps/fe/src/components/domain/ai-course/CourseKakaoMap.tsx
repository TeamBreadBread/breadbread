import { useEffect, useMemo, useRef, useState } from "react";
import mapImage from "@/assets/images/map.png";
import type { CourseDirectionPoint } from "@/api/courses";
import { loadKakaoMapSdk } from "@/lib/kakaoMapSdk";
import { fetchKakaoWalkingRoutePath } from "@/lib/kakaoWalkingRoute";
import type { KakaoLatLngBounds, KakaoMap } from "@/types/kakao-maps";
import { cn } from "@/utils/cn";
import { filterValidMapPoints, type CourseMapBakery } from "./courseMapPoints";

export type { CourseMapBakery } from "./courseMapPoints";

type Props = {
  bakeries: CourseMapBakery[];
  departurePoint?: { lat: number; lng: number; label: string } | null;
  routePath?: CourseDirectionPoint[] | null;
  className?: string;
};

type MapStatus = "loading" | "ready" | "fallback";

function mapPointsKey(points: CourseMapBakery[]): string {
  return points.map((b) => `${b.order}:${b.id}:${b.lat},${b.lng}`).join("|");
}

function getMarkerPalette(order: number, total: number) {
  if (order === 1) {
    return {
      background: "#2563eb",
      border: "#dbeafe",
      text: "#ffffff",
    };
  }
  if (order === total) {
    return {
      background: "#ef4444",
      border: "#fee2e2",
      text: "#ffffff",
    };
  }
  return {
    background: "#f59e0b",
    border: "#fef3c7",
    text: "#111827",
  };
}

function createOrderMarkerElement(order: number, total: number, name: string): HTMLDivElement {
  const palette = getMarkerPalette(order, total);
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

  const bubble = document.createElement("div");
  bubble.textContent = String(order);
  bubble.style.cssText = [
    "display:flex",
    "align-items:center",
    "justify-content:center",
    "width:30px",
    "height:30px",
    "border-radius:9999px",
    `background:${palette.background}`,
    `color:${palette.text}`,
    "font-size:14px",
    "font-weight:700",
    "line-height:1",
    "font-family:Pretendard,system-ui,sans-serif",
    `border:3px solid ${palette.border}`,
    "box-shadow:0 3px 10px rgba(15,23,42,0.28)",
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

  wrap.appendChild(bubble);
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

function CourseKakaoMapView({
  mapPoints,
  departurePoint,
  routePath,
  className,
}: {
  mapPoints: CourseMapBakery[];
  departurePoint?: { lat: number; lng: number; label: string } | null;
  routePath?: CourseDirectionPoint[] | null;
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
        mapRef.current = map;

        if (markerPositions.length > 1) {
          const routeCoords = orderedPoints.map((p) => ({ lat: p.lat, lng: p.lng }));
          let basePathPositions = markerPositions;
          let shouldDrawPolyline = false;

          if (routePath && routePath.length > 1) {
            basePathPositions = routePath.map((p) => new maps.LatLng(p.lat, p.lng));
            shouldDrawPolyline = true;
          } else if (routePath === null) {
            const walkingPath = await fetchKakaoWalkingRoutePath(routeCoords);
            if (cancelled) return;
            basePathPositions =
              walkingPath?.map((p) => new maps.LatLng(p.lat, p.lng)) ?? markerPositions;
            shouldDrawPolyline = true;
          }
          const pathPositions = basePathPositions;

          if (shouldDrawPolyline) {
            mapObjects.push(
              new maps.Polyline({
                map,
                path: pathPositions,
                strokeWeight: 10,
                strokeColor: "#ffffff",
                strokeOpacity: 0.95,
                strokeStyle: "solid",
              }),
            );
            mapObjects.push(
              new maps.Polyline({
                map,
                path: pathPositions,
                strokeWeight: 6,
                strokeColor: "#2563eb",
                strokeOpacity: 0.95,
                strokeStyle: "solid",
              }),
            );
          }

          const departureOverlayPosition = departurePoint
            ? new maps.LatLng(departurePoint.lat, departurePoint.lng)
            : null;

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
                content: createOrderMarkerElement(point.order, orderedPoints.length, point.name),
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
                content: createOrderMarkerElement(point.order, orderedPoints.length, point.name),
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
  }, [departurePoint, mapPoints, routePath]);

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

export default function CourseKakaoMap({ bakeries, departurePoint, routePath, className }: Props) {
  const mapPoints = useMemo(() => filterValidMapPoints(bakeries), [bakeries]);

  if (mapPoints.length === 0) {
    return (
      <img src={mapImage} alt="코스 지도" className={cn("h-full w-full object-cover", className)} />
    );
  }

  return (
    <CourseKakaoMapView
      key={mapPointsKey(mapPoints)}
      mapPoints={mapPoints}
      departurePoint={departurePoint}
      routePath={routePath}
      className={className}
    />
  );
}
