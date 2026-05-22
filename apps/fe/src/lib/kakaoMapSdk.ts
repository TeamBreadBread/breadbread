import type { KakaoNamespace } from "@/types/kakao-maps";

/** 카카오맵 JS SDK 동적 로드 (`autoload=false` → `kakao.maps.load` 후 사용). */

let loadPromise: Promise<KakaoNamespace> | null = null;

function getMapAppKey(): string | undefined {
  const key = import.meta.env.VITE_KAKAO_MAP_KEY?.trim();
  if (!key || key === "카카오_JavaScript_키") return undefined;
  return key;
}

export function isKakaoMapKeyConfigured(): boolean {
  return getMapAppKey() !== undefined;
}

function appendMapScript(appKey: string): Promise<KakaoNamespace> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-breadbread-kakao-maps="true"]',
    );
    if (existing) {
      existing.addEventListener("load", () => onScriptReady(resolve, reject), { once: true });
      existing.addEventListener("error", () => reject(new Error("카카오맵 SDK 로드 실패")), {
        once: true,
      });
      if (window.kakao?.maps) {
        onScriptReady(resolve, reject);
      }
      return;
    }

    const script = document.createElement("script");
    script.dataset.breadbreadKakaoMaps = "true";
    script.async = true;
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(appKey)}&autoload=false&libraries=services`;
    script.onload = () => onScriptReady(resolve, reject);
    script.onerror = () => reject(new Error("카카오맵 SDK 로드 실패"));
    document.head.appendChild(script);
  });
}

function onScriptReady(resolve: (k: KakaoNamespace) => void, reject: (e: Error) => void): void {
  if (!window.kakao?.maps) {
    reject(new Error("카카오맵 SDK가 초기화되지 않았습니다."));
    return;
  }
  window.kakao.maps.load(() => resolve(window.kakao!));
}

/** SDK 로드 완료 후 `window.kakao` 반환. 키 없으면 reject. */
export function loadKakaoMapSdk(): Promise<KakaoNamespace> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("브라우저 환경에서만 카카오맵을 사용할 수 있습니다."));
  }

  const appKey = getMapAppKey();
  if (!appKey) {
    return Promise.reject(
      new Error(
        "카카오맵을 쓰려면 `.env.local`에 `VITE_KAKAO_MAP_KEY`(JavaScript 키)를 설정하세요.",
      ),
    );
  }

  if (window.kakao?.maps) {
    return new Promise((resolve) => {
      window.kakao!.maps.load(() => resolve(window.kakao!));
    });
  }

  loadPromise ??= appendMapScript(appKey);
  return loadPromise;
}
