import type { BakeryMapBounds, BakeryMapPoint } from "@/components/domain/bakery-map/types";
import { hasValidMapCoordinates } from "@/lib/resolveMapCoordinates";

export type BakeryMapRowLike = {
  id: number;
  name: string;
  address: string;
  rating: number;
  reviewCount: number;
  bookmarkCount: number;
  liked: boolean;
  openTime?: string | null;
  closeTime?: string | null;
  images: string[];
  lat?: number | null;
  lng?: number | null;
};

export function toBakeryMapPoint(row: BakeryMapRowLike): BakeryMapPoint | null {
  if (!hasValidMapCoordinates(row.lat, row.lng)) return null;
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    lat: row.lat!,
    lng: row.lng!,
    rating: row.rating,
    reviewCount: row.reviewCount,
    bookmarkCount: row.bookmarkCount,
    liked: row.liked,
    openTime: row.openTime,
    closeTime: row.closeTime,
    images: row.images,
  };
}

export function mapRowsToBakeryPoints(rows: BakeryMapRowLike[]): BakeryMapPoint[] {
  const points: BakeryMapPoint[] = [];
  for (const row of rows) {
    const point = toBakeryMapPoint(row);
    if (point) points.push(point);
  }
  return points;
}

export function isPointInBounds(point: BakeryMapPoint, bounds: BakeryMapBounds): boolean {
  return (
    point.lat >= bounds.swLat &&
    point.lat <= bounds.neLat &&
    point.lng >= bounds.swLng &&
    point.lng <= bounds.neLng
  );
}

export function filterPointsInBounds(
  points: BakeryMapPoint[],
  bounds: BakeryMapBounds | null,
): BakeryMapPoint[] {
  if (!bounds) return points;
  return points.filter((point) => isPointInBounds(point, bounds));
}
