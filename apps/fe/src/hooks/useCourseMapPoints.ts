import { useEffect, useMemo, useState } from "react";
import type { CourseBakeryDetail } from "@/api/courses";
import {
  courseBakeriesToMapPoints,
  type CourseMapBakery,
} from "@/components/domain/ai-course/courseMapPoints";
import { resolveMapCoordinates } from "@/lib/resolveMapCoordinates";

function bakeriesKey(bakeries: CourseBakeryDetail[]): string {
  return bakeries
    .map((bakery, index) => `${index}:${bakery.id}:${bakery.address}:${bakery.lat}:${bakery.lng}`)
    .join("|");
}

export function useCourseMapPoints(bakeries: CourseBakeryDetail[] | undefined) {
  const bakeryKey = useMemo(() => (bakeries?.length ? bakeriesKey(bakeries) : ""), [bakeries]);
  const directPoints = useMemo(
    () => (bakeries?.length ? courseBakeriesToMapPoints(bakeries) : []),
    [bakeries],
  );
  const needsGeocoding = Boolean(bakeries?.length && directPoints.length !== bakeries.length);

  const [geocodedResult, setGeocodedResult] = useState<{
    key: string;
    points: CourseMapBakery[];
  } | null>(null);

  useEffect(() => {
    if (!needsGeocoding || !bakeries?.length) return undefined;

    let cancelled = false;

    void (async () => {
      const resolved: CourseMapBakery[] = [];
      for (let index = 0; index < bakeries.length; index++) {
        const bakery = bakeries[index]!;
        const coords = await resolveMapCoordinates(bakery.address, bakery.lat, bakery.lng);
        if (coords) {
          resolved.push({
            id: bakery.id,
            name: bakery.name,
            lat: coords.lat,
            lng: coords.lng,
            order: index + 1,
          });
        }
      }
      if (!cancelled) {
        setGeocodedResult({
          key: bakeryKey,
          points: resolved.length > 0 ? resolved : directPoints,
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [bakeryKey, bakeries, needsGeocoding, directPoints]);

  if (!bakeries?.length) {
    return { mapPoints: [], resolving: false };
  }

  if (!needsGeocoding) {
    return { mapPoints: directPoints, resolving: false };
  }

  const resolving = geocodedResult?.key !== bakeryKey;
  const mapPoints = geocodedResult?.key === bakeryKey ? geocodedResult.points : directPoints;

  return { mapPoints, resolving };
}
