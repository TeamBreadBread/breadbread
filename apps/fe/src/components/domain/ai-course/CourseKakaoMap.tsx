import { useEffect, useMemo, useRef, useState } from "react";
import mapImage from "@/assets/images/map.png";
import { loadKakaoMapSdk } from "@/lib/kakaoMapSdk";
import { cn } from "@/utils/cn";
import { filterValidMapPoints, type CourseMapBakery } from "./courseMapPoints";

export type { CourseMapBakery } from "./courseMapPoints";

type Props = {
  bakeries: CourseMapBakery[];
  className?: string;
};

type MapStatus = "loading" | "ready" | "fallback";

function mapPointsKey(points: CourseMapBakery[]): string {
  return points.map((b) => `${b.id}:${b.lat},${b.lng}`).join("|");
}

function CourseKakaoMapView({
  mapPoints,
  className,
}: {
  mapPoints: CourseMapBakery[];
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<MapStatus>("loading");

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;

    void loadKakaoMapSdk()
      .then((kakao) => {
        if (cancelled) return;

        const { maps } = kakao;
        const positions = mapPoints.map((b) => new maps.LatLng(b.lat, b.lng));
        const center = positions[0]!;

        const map = new maps.Map(container, {
          center,
          level: mapPoints.length === 1 ? 4 : 5,
        });

        for (const position of positions) {
          new maps.Marker({ map, position });
        }

        if (positions.length > 1) {
          new maps.Polyline({
            map,
            path: positions,
            strokeWeight: 5,
            strokeColor: "#374151",
            strokeOpacity: 0.85,
            strokeStyle: "solid",
          });

          const bounds = new maps.LatLngBounds();
          for (const position of positions) {
            bounds.extend(position);
          }
          map.setBounds(bounds);
        }

        if (!cancelled) setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("fallback");
      });

    return () => {
      cancelled = true;
      container.replaceChildren();
    };
  }, [mapPoints]);

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
