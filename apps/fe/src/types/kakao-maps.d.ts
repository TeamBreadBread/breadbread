/** 카카오맵 JS SDK (필요한 부분만 선언). */

interface KakaoMaps {
  load(callback: () => void): void;
  LatLng: new (lat: number, lng: number) => KakaoLatLng;
  LatLngBounds: new () => KakaoLatLngBounds;
  Map: new (container: HTMLElement, options: KakaoMapOptions) => KakaoMap;
  Marker: new (options: { position: KakaoLatLng; map?: KakaoMap }) => KakaoMarker;
  CustomOverlay: new (options: KakaoCustomOverlayOptions) => KakaoCustomOverlay;
  Polyline: new (options: KakaoPolylineOptions) => KakaoPolyline;
  services: KakaoMapServices;
}

interface KakaoMapServices {
  Places: new () => KakaoPlacesService;
  Geocoder: new () => KakaoGeocoder;
  Status: {
    OK: string;
    ZERO_RESULT: string;
    ERROR: string;
  };
}

interface KakaoAddressSearchResult {
  x: string;
  y: string;
}

interface KakaoGeocoder {
  coord2Address(
    lng: number,
    lat: number,
    callback: (result: unknown[], status: string) => void,
  ): void;
  addressSearch(
    address: string,
    callback: (result: KakaoAddressSearchResult[], status: string) => void,
  ): void;
}

interface KakaoPlacesService {
  keywordSearch(keyword: string, callback: (data: unknown[], status: string) => void): void;
}

interface KakaoLatLng {
  getLat(): number;
  getLng(): number;
}

interface KakaoMapOptions {
  center: KakaoLatLng;
  level: number;
  draggable?: boolean;
}

interface KakaoMap {
  setCenter(latlng: KakaoLatLng): void;
  setBounds(
    bounds: KakaoLatLngBounds,
    paddingTop?: number,
    paddingRight?: number,
    paddingBottom?: number,
    paddingLeft?: number,
  ): void;
  setDraggable(draggable: boolean): void;
  setZoomable(zoomable: boolean): void;
  relayout(): void;
}

interface KakaoLatLngBounds {
  extend(latlng: KakaoLatLng): void;
}

interface KakaoPolylineOptions {
  map?: KakaoMap;
  path: KakaoLatLng[];
  strokeWeight?: number;
  strokeColor?: string;
  strokeOpacity?: number;
  strokeStyle?: string;
}

interface KakaoPolyline {
  setMap(map: KakaoMap | null): void;
}

interface KakaoMarker {
  setMap(map: KakaoMap | null): void;
}

interface KakaoCustomOverlayOptions {
  map?: KakaoMap;
  position: KakaoLatLng;
  content: string | HTMLElement;
  xAnchor?: number;
  yAnchor?: number;
  zIndex?: number;
}

interface KakaoCustomOverlay {
  setMap(map: KakaoMap | null): void;
}

interface KakaoNamespace {
  maps: KakaoMaps;
}

declare global {
  interface Window {
    kakao?: KakaoNamespace;
  }
}

export type {
  KakaoCustomOverlay,
  KakaoLatLng,
  KakaoLatLngBounds,
  KakaoMap,
  KakaoMaps,
  KakaoNamespace,
};
