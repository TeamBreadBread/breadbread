import { useEffect, useMemo, useRef, useState } from "react";
import mapImage from "@/assets/images/map.png";
import type { BakeryMapBounds, BakeryMapPoint } from "@/components/domain/bakery-map/types";
import { BAKERY_MAP_DEFAULT_LEVEL } from "@/lib/bakeryMapConstants";
import { loadKakaoMapSdk } from "@/lib/kakaoMapSdk";
import type { KakaoCustomOverlay, KakaoMap } from "@/types/kakao-maps";
import { cn } from "@/utils/cn";

type BakeryMapViewProps = {
  bakeries: BakeryMapPoint[];
  center: { lat: number; lng: number };
  selectedBakeryId: number | null;
  onSelectBakery: (bakeryId: number) => void;
  onBoundsChange: (bounds: BakeryMapBounds) => void;
  onMapReady?: () => void;
  layoutKey?: number;
  className?: string;
  bottomPadding?: number;
};

type MapStatus = "loading" | "ready" | "fallback";

function boundsFromMap(map: KakaoMap): BakeryMapBounds | null {
  try {
    const bounds = map.getBounds();
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();
    return {
      swLat: sw.getLat(),
      swLng: sw.getLng(),
      neLat: ne.getLat(),
      neLng: ne.getLng(),
    };
  } catch {
    return null;
  }
}

function createBakeryMarkerElement(name: string, selected: boolean): HTMLButtonElement {
  const wrap = document.createElement("button");
  wrap.type = "button";
  wrap.setAttribute("aria-label", name);
  wrap.style.cssText = [
    "display:flex",
    "flex-direction:column",
    "align-items:center",
    "gap:2px",
    "border:none",
    "background:transparent",
    "padding:0",
    "cursor:pointer",
  ].join(";");

  const dot = document.createElement("div");
  dot.style.cssText = [
    "width:14px",
    "height:14px",
    "border-radius:9999px",
    selected ? "background:#FF8648" : "background:#41454E",
    selected
      ? "box-shadow:0 0 0 4px rgba(255,134,72,0.35)"
      : "box-shadow:0 1px 4px rgba(0,0,0,0.2)",
    "border:2px solid #ffffff",
  ].join(";");

  const label = document.createElement("span");
  label.textContent = name;
  label.style.cssText = [
    "max-width:88px",
    "overflow:hidden",
    "text-overflow:ellipsis",
    "white-space:nowrap",
    "font-family:Pretendard,sans-serif",
    "font-size:11px",
    "font-weight:600",
    "line-height:14px",
    "color:#1A1F27",
    "background:#ffffff",
    "border-radius:6px",
    "padding:2px 6px",
    "box-shadow:0 1px 4px rgba(0,0,0,0.12)",
    selected ? "display:block" : "display:none",
  ].join(";");

  wrap.appendChild(dot);
  wrap.appendChild(label);
  return wrap;
}

function createUserLocationElement(): HTMLDivElement {
  const wrap = document.createElement("div");
  wrap.setAttribute("aria-hidden", "true");
  wrap.style.cssText =
    "display:flex;align-items:center;justify-content:center;width:24px;height:24px;";

  const ring = document.createElement("div");
  ring.style.cssText =
    "width:16px;height:16px;border-radius:9999px;background:#6EB0FF;border:3px solid #ffffff;box-shadow:0 1px 6px rgba(0,0,0,0.2);";
  wrap.appendChild(ring);
  return wrap;
}

export default function BakeryMapView({
  bakeries,
  center,
  selectedBakeryId,
  onSelectBakery,
  onBoundsChange,
  onMapReady,
  layoutKey,
  className,
  bottomPadding = 0,
}: BakeryMapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<KakaoMap | null>(null);
  const overlaysRef = useRef<Map<number, KakaoCustomOverlay>>(new Map());
  const userOverlayRef = useRef<KakaoCustomOverlay | null>(null);
  const onBoundsChangeRef = useRef(onBoundsChange);
  const onSelectRef = useRef(onSelectBakery);
  const [status, setStatus] = useState<MapStatus>("loading");

  onBoundsChangeRef.current = onBoundsChange;
  onSelectRef.current = onSelectBakery;

  const bakeriesKey = useMemo(
    () => bakeries.map((b) => `${b.id}:${b.lat},${b.lng}`).join("|"),
    [bakeries],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const overlayMap = overlaysRef.current;
    let cancelled = false;
    let idleHandler: (() => void) | null = null;

    void (async () => {
      setStatus("loading");
      try {
        const kakao = await loadKakaoMapSdk();
        if (cancelled) return;

        const { maps } = kakao;
        const map = new maps.Map(container, {
          center: new maps.LatLng(center.lat, center.lng),
          level: BAKERY_MAP_DEFAULT_LEVEL,
          draggable: true,
        });
        map.setDraggable(true);
        map.setZoomable(true);
        mapRef.current = map;

        idleHandler = () => {
          const nextBounds = boundsFromMap(map);
          if (nextBounds) onBoundsChangeRef.current(nextBounds);
        };
        maps.event.addListener(map, "idle", idleHandler);
        idleHandler();

        if (!cancelled) {
          setStatus("ready");
          onMapReady?.();
        }
      } catch {
        if (!cancelled) setStatus("fallback");
      }
    })();

    return () => {
      cancelled = true;
      const map = mapRef.current;
      if (map && idleHandler) {
        try {
          void loadKakaoMapSdk().then((kakao) => {
            kakao.maps.event.removeListener(map, "idle", idleHandler!);
          });
        } catch {
          /* ignore */
        }
      }
      overlayMap.forEach((overlay) => overlay.setMap(null));
      overlayMap.clear();
      userOverlayRef.current?.setMap(null);
      userOverlayRef.current = null;
      mapRef.current = null;
      container.replaceChildren();
    };
    // center is applied in a dedicated effect
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || status !== "ready") return;
    void loadKakaoMapSdk().then((kakao) => {
      map.setCenter(new kakao.maps.LatLng(center.lat, center.lng));
    });
  }, [center.lat, center.lng, status]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || status !== "ready") return;

    let cancelled = false;

    void loadKakaoMapSdk().then((kakao) => {
      if (cancelled) return;
      const { maps } = kakao;
      const position = new maps.LatLng(center.lat, center.lng);

      userOverlayRef.current?.setMap(null);
      const userOverlay = new maps.CustomOverlay({
        position,
        content: createUserLocationElement(),
        xAnchor: 0.5,
        yAnchor: 0.5,
        zIndex: 3,
      });
      userOverlay.setMap(map);
      userOverlayRef.current = userOverlay;
    });

    return () => {
      cancelled = true;
    };
  }, [center.lat, center.lng, status]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || status !== "ready") return;

    let cancelled = false;

    void loadKakaoMapSdk().then((kakao) => {
      if (cancelled) return;
      const { maps } = kakao;
      const nextIds = new Set(bakeries.map((b) => b.id));

      overlaysRef.current.forEach((overlay, id) => {
        if (!nextIds.has(id)) {
          overlay.setMap(null);
          overlaysRef.current.delete(id);
        }
      });

      for (const bakery of bakeries) {
        const selected = bakery.id === selectedBakeryId;
        const existing = overlaysRef.current.get(bakery.id);
        const position = new maps.LatLng(bakery.lat, bakery.lng);

        if (existing) {
          existing.setMap(null);
        }

        const element = createBakeryMarkerElement(bakery.name, selected);
        element.addEventListener("click", (event) => {
          event.stopPropagation();
          onSelectRef.current(bakery.id);
        });

        const overlay = new maps.CustomOverlay({
          position,
          content: element,
          xAnchor: 0.5,
          yAnchor: 1,
          zIndex: selected ? 4 : 2,
        });
        overlay.setMap(map);
        overlaysRef.current.set(bakery.id, overlay);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [bakeries, bakeriesKey, selectedBakeryId, status]);

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
  }, [layoutKey, status]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || status !== "ready" || selectedBakeryId == null) return;

    const selected = bakeries.find((b) => b.id === selectedBakeryId);
    if (!selected) return;

    void loadKakaoMapSdk().then((kakao) => {
      const position = new kakao.maps.LatLng(selected.lat, selected.lng);
      map.setCenter(position);
    });
  }, [bakeries, selectedBakeryId, status]);

  if (status === "fallback") {
    return (
      <img src={mapImage} alt="빵집 지도" className={cn("h-full w-full object-cover", className)} />
    );
  }

  return (
    <div className={cn("relative h-full w-full overflow-hidden", className)}>
      <div ref={containerRef} className="h-full w-full" aria-label="빵집 지도" />
      {status === "loading" ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-gray-100 font-pretendard text-size-3 text-gray-700">
          지도 불러오는 중…
        </div>
      ) : null}
      {bottomPadding > 0 ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-white/30 to-transparent" />
      ) : null}
    </div>
  );
}
