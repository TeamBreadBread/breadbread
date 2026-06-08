import { loadKakaoMapSdk } from "@/lib/kakaoMapSdk";

export function hasValidMapCoordinates(lat?: number | null, lng?: number | null): boolean {
  return (
    lat != null &&
    lng != null &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    !(lat === 0 && lng === 0)
  );
}

/** API 좌표가 없으면 카카오 Geocoder로 주소를 좌표로 변환한다. */
export async function resolveMapCoordinates(
  address: string,
  lat?: number | null,
  lng?: number | null,
): Promise<{ lat: number; lng: number } | null> {
  if (hasValidMapCoordinates(lat, lng)) {
    return { lat: lat!, lng: lng! };
  }

  const trimmed = address.trim();
  if (!trimmed) return null;

  try {
    const kakao = await loadKakaoMapSdk();
    const services = kakao.maps.services;
    if (!services?.Geocoder) return null;

    const geocoder = new services.Geocoder();
    return await new Promise((resolve) => {
      geocoder.addressSearch(trimmed, (result: { x?: string; y?: string }[], status: string) => {
        if (status !== services.Status.OK || !result?.[0]) {
          resolve(null);
          return;
        }
        const first = result[0];
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
