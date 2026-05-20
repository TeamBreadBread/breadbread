import type { CourseBakeryDetail } from "@/api/courses";

export type CourseMapBakery = {
  id: number;
  name: string;
  lat: number;
  lng: number;
};

function isValidCoordinate(lat: number, lng: number): boolean {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (lat === 0 && lng === 0) return false;
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

export function courseBakeriesToMapPoints(bakeries: CourseBakeryDetail[]): CourseMapBakery[] {
  return bakeries
    .filter((b) => isValidCoordinate(b.lat, b.lng))
    .map((b) => ({
      id: b.id,
      name: b.name,
      lat: b.lat,
      lng: b.lng,
    }));
}

export function filterValidMapPoints(bakeries: CourseMapBakery[]): CourseMapBakery[] {
  return bakeries.filter((b) => isValidCoordinate(b.lat, b.lng));
}
