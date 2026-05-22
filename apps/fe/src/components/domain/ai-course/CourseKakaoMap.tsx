import { useEffect, useMemo, useRef, useState } from "react";
import mapImage from "@/assets/images/map.png";
import { loadKakaoMapSdk } from "@/lib/kakaoMapSdk";
import { fetchKakaoWalkingRoutePath } from "@/lib/kakaoWalkingRoute";
import type { KakaoLatLngBounds, KakaoMap } from "@/types/kakao-maps";
import { cn } from "@/utils/cn";
import { filterValidMapPoints, type CourseMapBakery } from "./courseMapPoints";

export type { CourseMapBakery } from "./courseMapPoints";

type Props = {
  bakeries: CourseMapBakery[];
  className?: string;
};

type MapStatus = "loading" | "ready" | "fallback";

function mapPointsKey(points: CourseMapBakery[]): string {
  return points.map((b) => `${b.order}:${b.id}:${b.lat},${b.lng}`).join("|");
}

function createOrderMarkerElement(order: number, name: string): HTMLDivElement {
  const el = document.createElement("div");
  el.textContent = String(order);
  el.setAttribute("role", "img");
  el.setAttribute("aria-label", `${order}번째 ${name}`);
  el.style.cssText = [
    "display:flex",
    "align-items:center",
    "justify-content:center",
    "width:28px",
    "height:28px",
    "border-radius:9999px",
    "background:#1f2937",
    "color:#fff",
    "font-size:14px",
    "font-weight:700",
    "line-height:1",
    "font-family:Pretendard,system-ui,sans-serif",
    "border:2px solid #fff",
    "box-shadow:0 2px 6px rgba(0,0,0,0.28)",
    "box-sizing:border-box",
    "user-select:none",
    "pointer-events:none",
  ].join(";");
  return el;
}

function CourseKakaoMapView({
  mapPoints,
  className,
}: {
  mapPoints: CourseMapBakery[];
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<KakaoMap | null>(null);
  const boundsRef = useRef<KakaoLatLngBounds | null>(null);
  const [status, setStatus] = useState<MapStatus>("loading");

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    const overlays: Array<{ setMap: (map: null) => void }> = [];

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
        });
        mapRef.current = map;

        for (const point of orderedPoints) {
          const position = new maps.LatLng(point.lat, point.lng);
          overlays.push(
            new maps.CustomOverlay({
              map,
              position,
              content: createOrderMarkerElement(point.order, point.name),
              yAnchor: 1,
              zIndex: point.order,
            }),
          );
        }

        if (markerPositions.length > 1) {
          const routeCoords = orderedPoints.map((p) => ({ lat: p.lat, lng: p.lng }));
          const walkingPath = await fetchKakaoWalkingRoutePath(routeCoords);
          if (cancelled) return;

          const pathPositions =
            walkingPath?.map((p) => new maps.LatLng(p.lat, p.lng)) ?? markerPositions;

          new maps.Polyline({
            map,
            path: pathPositions,
            strokeWeight: 5,
            strokeColor: "#374151",
            strokeOpacity: 0.85,
            strokeStyle: "solid",
          });

          const bounds = new maps.LatLngBounds();
          for (const position of pathPositions) {
            bounds.extend(position);
          }
          boundsRef.current = bounds;
          map.setBounds(bounds);
        } else {
          boundsRef.current = null;
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
      for (const overlay of overlays) {
        overlay.setMap(null);
      }
      container.replaceChildren();
    };
  }, [mapPoints]);

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

export default function CourseKakaoMap({ bakeries, className }: Props) {
  const mapPoints = useMemo(() => filterValidMapPoints(bakeries), [bakeries]);

  if (mapPoints.length === 0) {
    return (
      <img src={mapImage} alt="코스 지도" className={cn("h-full w-full object-cover", className)} />
    );
  }

  return (
    <CourseKakaoMapView key={mapPointsKey(mapPoints)} mapPoints={mapPoints} className={className} />
  );
}
