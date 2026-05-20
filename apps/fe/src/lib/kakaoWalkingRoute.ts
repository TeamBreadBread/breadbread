/** 카카오모빌리티 보행 길찾기 — 도로/보도를 따라가는 경로 좌표 (직선 polyline 대체) */

export type RouteLatLng = { lat: number; lng: number };

type WalkingDirectionsResponse = {
  routes?: Array<{
    result_code?: number;
    sections?: Array<{
      roads?: Array<{ vertexes?: number[] }>;
    }>;
  }>;
};

function getRestApiKey(): string | undefined {
  const key = import.meta.env.VITE_KAKAO_REST_API_KEY?.trim();
  if (!key || key === "카카오_REST_API_KEY") return undefined;
  return key;
}

function toCoordParam(point: RouteLatLng): string {
  return `${point.lng},${point.lat}`;
}

function parseVertexes(data: WalkingDirectionsResponse): RouteLatLng[] | null {
  const route = data.routes?.[0];
  if (!route || route.result_code !== 0) return null;

  const path: RouteLatLng[] = [];
  for (const section of route.sections ?? []) {
    for (const road of section.roads ?? []) {
      const vertexes = road.vertexes ?? [];
      for (let i = 0; i + 1 < vertexes.length; i += 2) {
        const lng = vertexes[i]!;
        const lat = vertexes[i + 1]!;
        const prev = path[path.length - 1];
        if (prev && prev.lat === lat && prev.lng === lng) continue;
        path.push({ lat, lng });
      }
    }
  }
  return path.length >= 2 ? path : null;
}

/**
 * 방문 순서대로 보행 경로 좌표를 조회합니다.
 * - 성공: 인도/보도 기준 경로 꺾은선
 * - 실패(null): API 미승인·CORS·좌표 오류 등 → 호출부에서 직선 폴백
 */
export async function fetchKakaoWalkingRoutePath(
  orderedPoints: RouteLatLng[],
): Promise<RouteLatLng[] | null> {
  if (orderedPoints.length < 2) return null;

  const apiKey = getRestApiKey();
  if (!apiKey) return null;

  const origin = toCoordParam(orderedPoints[0]!);
  const destination = toCoordParam(orderedPoints[orderedPoints.length - 1]!);
  const waypoints = orderedPoints.slice(1, -1).map(toCoordParam).join("|");

  const params = new URLSearchParams({
    origin,
    destination,
    priority: "MAIN_STREET",
    summary: "false",
  });
  if (waypoints) params.set("waypoints", waypoints);

  const url = import.meta.env.DEV
    ? `/kakao-mobility/affiliate/walking/v1/directions?${params.toString()}`
    : `https://apis-navi.kakaomobility.com/affiliate/walking/v1/directions?${params.toString()}`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `KakaoAK ${apiKey}`,
        service: "breadbread",
        accept: "application/json",
      },
    });
    if (!response.ok) return null;
    const data = (await response.json()) as WalkingDirectionsResponse;
    return parseVertexes(data);
  } catch {
    return null;
  }
}

export function isKakaoWalkingRouteConfigured(): boolean {
  return getRestApiKey() !== undefined;
}
