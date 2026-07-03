import { useCallback, useEffect, useRef, useState } from "react";
import { BAKERY_MAP_DEFAULT_LEVEL, DEFAULT_BAKERY_MAP_CENTER } from "@/lib/bakeryMapConstants";
import { getAccuratePosition } from "@/lib/getAccuratePosition";
import type { BakeryMapLocationState } from "@/components/domain/bakery-map/types";

type UseBakeryMapLocationResult = {
  center: BakeryMapLocationState;
  loading: boolean;
  permissionDenied: boolean;
  recenterToUser: () => void;
  mapLevel: number;
};

export function useBakeryMapLocation(enabled: boolean): UseBakeryMapLocationResult {
  const [center, setCenter] = useState<BakeryMapLocationState>({
    lat: DEFAULT_BAKERY_MAP_CENTER.lat,
    lng: DEFAULT_BAKERY_MAP_CENTER.lng,
    source: "default",
  });
  const [loading, setLoading] = useState(enabled);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const resolvedRef = useRef(false);

  const applyDefaultCenter = useCallback(() => {
    setCenter({
      lat: DEFAULT_BAKERY_MAP_CENTER.lat,
      lng: DEFAULT_BAKERY_MAP_CENTER.lng,
      source: "default",
    });
  }, []);

  const resolveLocation = useCallback(async () => {
    setLoading(true);
    try {
      const position = await getAccuratePosition({ maxWaitMs: 12_000, targetAccuracyM: 80 });
      setPermissionDenied(false);
      setCenter({
        lat: position.latitude,
        lng: position.longitude,
        source: "geolocation",
      });
    } catch {
      setPermissionDenied(true);
      applyDefaultCenter();
    } finally {
      setLoading(false);
    }
  }, [applyDefaultCenter]);

  useEffect(() => {
    if (!enabled || resolvedRef.current) return;
    resolvedRef.current = true;
    void resolveLocation();
  }, [enabled, resolveLocation]);

  const recenterToUser = useCallback(() => {
    void resolveLocation();
  }, [resolveLocation]);

  return {
    center,
    loading,
    permissionDenied,
    recenterToUser,
    mapLevel: BAKERY_MAP_DEFAULT_LEVEL,
  };
}
