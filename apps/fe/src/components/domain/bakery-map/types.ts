export type BakeryMapViewMode = "list" | "map";

export type BakeryMapPoint = {
  id: number;
  name: string;
  address: string;
  lat: number;
  lng: number;
  rating: number;
  reviewCount: number;
  bookmarkCount: number;
  liked: boolean;
  openTime?: string | null;
  closeTime?: string | null;
  images: string[];
};

export type BakeryMapBounds = {
  swLat: number;
  swLng: number;
  neLat: number;
  neLng: number;
};

export type BakeryMapLocationState = {
  lat: number;
  lng: number;
  source: "geolocation" | "default";
};
