import { useEffect, useRef, useState } from "react";
import mapImage from "@/assets/images/map.png";
import { loadKakaoMapSdk } from "@/lib/kakaoMapSdk";
import type { KakaoMap } from "@/types/kakao-maps";
import { cn } from "@/utils/cn";

type BakeryKakaoMapPreviewProps = {
  name: string;
  address: string;
  lat?: number | null;
  lng?: number | null;
  className?: string;
};

type MapStatus = "loading" | "ready" | "fallback" | "no-location";

function hasValidCoords(lat?: number | null, lng?: number | null): boolean {
  return (
    lat != null &&
    lng != null &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    !(lat === 0 && lng === 0)
  );
}

async function resolveCoordinates(
  address: string,
  lat?: number | null,
  lng?: number | null,
): Promise<{ lat: number; lng: number } | null> {
  if (hasValidCoords(lat, lng)) {
    return { lat: lat!, lng: lng! };
  }

  const trimmed = address.trim();
  if (!trimmed) return null;

  try {
    const kakao = await loadKakaoMapSdk();
    const { services } = kakao;
    if (!services?.Geocoder) return null;

    const geocoder = new services.Geocoder();
    return await new Promise((resolve) => {
      geocoder.addressSearch(trimmed, (result, status) => {
        if (status !== services.Status.OK || !result?.[0]) {
          resolve(null);
          return;
        }
        const first = result[0] as { x?: string; y?: string };
        const resolvedLat = Number(first.y);
        const resolvedLng = Number(first.x);
        if (!Number.isFinite(resolvedLat) || !Number.isFinite(resolvedLng)) {
          resolve(null);
          return;
        }
        resolve({ lat: resolvedLat, lng: resolvedLng });
      });
    });
  } catch {
    return null;
  }
}

export default function BakeryKakaoMapPreview({
  name,
  address,
  lat,
  lng,
  className,
}: BakeryKakaoMapPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<KakaoMap | null>(null);
  const [status, setStatus] = useState<MapStatus>("loading");

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    let marker: { setMap: (map: null) => void } | null = null;

    void (async () => {
      setStatus("loading");
      const coords = await resolveCoordinates(address, lat, lng);
      if (cancelled) return;

      if (!coords) {
        setStatus("no-location");
        return;
      }

      try {
        const kakao = await loadKakaoMapSdk();
        if (cancelled) return;

        const { maps } = kakao;
        const center = new maps.LatLng(coords.lat, coords.lng);
        const map = new maps.Map(container, {
          center,
          level: 3,
          draggable: true,
        });
        mapRef.current = map;
        marker = new maps.Marker({ position: center, map });

        if (!cancelled) setStatus("ready");
      } catch {
        if (!cancelled) setStatus("fallback");
      }
    })();

    return () => {
      cancelled = true;
      marker?.setMap(null);
      mapRef.current = null;
      container.replaceChildren();
    };
  }, [address, lat, lng, name]);

  useEffect(() => {
    if (status !== "ready") return;
    const container = containerRef.current;
    const map = mapRef.current;
    if (!container || !map) return;

    const relayout = () => map.relayout();
    const observer = new ResizeObserver(relayout);
    observer.observe(container);
    relayout();
    return () => observer.disconnect();
  }, [status]);

  if (status === "fallback") {
    return (
      <img
        src={mapImage}
        alt={`${name} 위치`}
        className={cn("h-full w-full object-cover", className)}
      />
    );
  }

  if (status === "no-location") {
    return (
      <div
        className={cn(
          "flex h-full w-full items-center justify-center bg-gray-100 px-4 text-center text-[13px] leading-[18px] text-gray-600",
          className,
        )}
      >
        지도를 표시할 위치 정보가 없습니다.
      </div>
    );
  }

  return (
    <div className={cn("relative h-full w-full overflow-hidden", className)}>
      <div ref={containerRef} className="h-full w-full" aria-label={`${name} 지도`} />
      {status === "loading" ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-gray-100 text-[13px] text-gray-600">
          지도 불러오는 중…
        </div>
      ) : null}
    </div>
  );
}
