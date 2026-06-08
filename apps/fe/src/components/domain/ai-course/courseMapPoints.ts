import type { CourseBakeryDetail } from "@/api/courses";

export type CourseMapBakery = {
  id: number;
  name: string;
  lat: number;
  lng: number;
  /** 코스 방문 순서 (1부터, API bakeries 배열 순서 기준) */
  order: number;
};

function normalizeCoordinate(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : Number.NaN;
  }
  return Number.NaN;
}

function readBakeryCoordinates(bakery: CourseBakeryDetail): { lat: number; lng: number } {
  const raw = bakery as CourseBakeryDetail & { latitude?: unknown; longitude?: unknown };
  return {
    lat: normalizeCoordinate(raw.lat ?? raw.latitude),
    lng: normalizeCoordinate(raw.lng ?? raw.longitude),
  };
}

function isValidCoordinate(lat: number, lng: number): boolean {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (lat === 0 && lng === 0) return false;
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

export function courseBakeriesToMapPoints(bakeries: CourseBakeryDetail[]): CourseMapBakery[] {
  const points: CourseMapBakery[] = [];
  bakeries.forEach((b, index) => {
    const { lat, lng } = readBakeryCoordinates(b);
    if (!isValidCoordinate(lat, lng)) return;
    points.push({
      id: b.id,
      name: b.name,
      lat,
      lng,
      order: index + 1,
    });
  });
  return points;
}

export function filterValidMapPoints(bakeries: CourseMapBakery[]): CourseMapBakery[] {
  return bakeries.filter((b) => isValidCoordinate(b.lat, b.lng));
}
