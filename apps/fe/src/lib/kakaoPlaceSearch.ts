import { loadKakaoMapSdk } from "@/lib/kakaoMapSdk";

export type KakaoSearchPlace = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
};

type KakaoKeywordDocument = {
  id?: string;
  place_name?: string;
  address_name?: string;
  road_address_name?: string;
  x?: string;
  y?: string;
};

function getRestApiKey(): string | undefined {
  const key = import.meta.env.VITE_KAKAO_REST_API_KEY?.trim();
  if (!key || key === "카카오_REST_API_KEY") return undefined;
  return key;
}

function mapDocument(doc: KakaoKeywordDocument): KakaoSearchPlace | null {
  const name = doc.place_name?.trim();
  const lat = Number.parseFloat(doc.y ?? "");
  const lng = Number.parseFloat(doc.x ?? "");
  if (!name || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const address = (doc.road_address_name || doc.address_name || "").trim();
  return {
    id: doc.id ?? `${name}-${lat}-${lng}`,
    name,
    address,
    lat,
    lng,
  };
}

async function searchViaRestApi(keyword: string): Promise<KakaoSearchPlace[]> {
  const apiKey = getRestApiKey();
  if (!apiKey) return [];

  const url = new URL("https://dapi.kakao.com/v2/local/search/keyword.json");
  url.searchParams.set("query", keyword);
  url.searchParams.set("size", "15");

  const response = await fetch(url.toString(), {
    headers: { Authorization: `KakaoAK ${apiKey}` },
  });

  if (!response.ok) {
    throw new Error("카카오 장소 검색에 실패했습니다.");
  }

  const body = (await response.json()) as { documents?: KakaoKeywordDocument[] };
  return (body.documents ?? [])
    .map(mapDocument)
    .filter((item): item is KakaoSearchPlace => item !== null);
}

async function searchViaMapSdk(keyword: string): Promise<KakaoSearchPlace[]> {
  await loadKakaoMapSdk();
  const kakao = window.kakao;
  const services = kakao?.maps?.services;
  if (!services?.Places || !services.Status) {
    throw new Error("카카오맵 장소 검색 서비스를 사용할 수 없습니다.");
  }

  const places = new services.Places();

  return new Promise((resolve, reject) => {
    places.keywordSearch(keyword, (data, status) => {
      if (status === services.Status.OK) {
        const docs = (data ?? []) as KakaoKeywordDocument[];
        resolve(docs.map(mapDocument).filter((item): item is KakaoSearchPlace => item !== null));
        return;
      }
      if (status === services.Status.ZERO_RESULT) {
        resolve([]);
        return;
      }
      reject(new Error("카카오 장소 검색에 실패했습니다."));
    });
  });
}

/** 키워드로 장소 검색 (REST API 우선, 실패 시 카카오맵 SDK services). */
export async function searchKakaoPlacesByKeyword(keyword: string): Promise<KakaoSearchPlace[]> {
  const q = keyword.trim();
  if (!q) return [];

  if (getRestApiKey()) {
    try {
      return await searchViaRestApi(q);
    } catch {
      /* SDK fallback */
    }
  }

  return searchViaMapSdk(q);
}

export function isKakaoPlaceSearchConfigured(): boolean {
  return Boolean(getRestApiKey()) || Boolean(import.meta.env.VITE_KAKAO_MAP_KEY?.trim());
}

type Coord2AddressDocument = {
  road_address?: {
    address_name?: string;
    building_name?: string;
  };
  address?: {
    address_name?: string;
  };
};

function formatRoadAddressLabel(
  roadAddr?: string,
  buildingName?: string,
  jibunAddr?: string,
): string {
  const road = roadAddr?.trim() ?? "";
  const building = buildingName?.trim() ?? "";
  if (road && building) return `${road}, ${building}`;
  if (road) return road;
  return jibunAddr?.trim() ?? "";
}

async function kakaoRestGet<T>(path: string, params: Record<string, string>): Promise<T> {
  const apiKey = getRestApiKey();
  if (!apiKey) {
    throw new Error("카카오 REST API 키가 없습니다.");
  }
  const url = new URL(`https://dapi.kakao.com${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  const response = await fetch(url.toString(), {
    headers: { Authorization: `KakaoAK ${apiKey}` },
  });
  if (!response.ok) {
    throw new Error("카카오 위치 조회에 실패했습니다.");
  }
  return (await response.json()) as T;
}

/** coord → 도로명·지번 주소 */
async function addressFromCoordinates(lat: number, lng: number): Promise<KakaoSearchPlace | null> {
  const body = await kakaoRestGet<{ documents?: Coord2AddressDocument[] }>(
    "/v2/local/geo/coord2address.json",
    {
      x: String(lng),
      y: String(lat),
      input_coord: "WGS84",
    },
  );
  const doc = body.documents?.[0];
  if (!doc) return null;

  const road = doc.road_address;
  const jibun = doc.address;
  const roadAddr = road?.address_name?.trim();
  const building = road?.building_name?.trim();
  const jibunAddr = jibun?.address_name?.trim();
  const address = formatRoadAddressLabel(roadAddr, building, jibunAddr);

  return {
    id: `coord-${lat}-${lng}`,
    name: address || "현재 위치",
    address,
    lat,
    lng,
  };
}

async function resolveViaSdkGeocoder(lat: number, lng: number): Promise<KakaoSearchPlace | null> {
  await loadKakaoMapSdk();
  const services = window.kakao?.maps?.services;
  if (!services?.Geocoder || !services.Status) return null;

  const geocoder = new services.Geocoder();

  return new Promise((resolve) => {
    geocoder.coord2Address(lng, lat, (result, status) => {
      if (status !== services.Status.OK || !result?.[0]) {
        resolve(null);
        return;
      }
      const row = result[0] as {
        road_address?: { address_name?: string; building_name?: string };
        address?: { address_name?: string };
      };
      const road = row.road_address;
      const jibun = row.address;
      const roadAddr = road?.address_name?.trim();
      const building = road?.building_name?.trim();
      const jibunAddr = jibun?.address_name?.trim();
      const address = formatRoadAddressLabel(roadAddr, building, jibunAddr);
      resolve({
        id: `coord-${lat}-${lng}`,
        name: address || "현재 위치",
        address,
        lat,
        lng,
      });
    });
  });
}

/** GPS 좌표 → 도로명·지번 주소 (표시용 `address` 우선). */
export async function resolveCurrentLocationPlace(
  lat: number,
  lng: number,
): Promise<KakaoSearchPlace> {
  try {
    if (getRestApiKey()) {
      const fromRest = await addressFromCoordinates(lat, lng);
      if (fromRest) return { ...fromRest, lat, lng };
    }
  } catch {
    /* SDK fallback */
  }

  const fromSdk = await resolveViaSdkGeocoder(lat, lng);
  if (fromSdk) return { ...fromSdk, lat, lng };

  return {
    id: `current-${lat}-${lng}`,
    name: "현재 위치",
    address: "",
    lat,
    lng,
  };
}
