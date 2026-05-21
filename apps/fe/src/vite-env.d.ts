/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_KAKAO_REST_API_KEY?: string;
  readonly VITE_KAKAO_MAP_KEY?: string;
  readonly VITE_NAVER_CLIENT_ID?: string;
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  readonly VITE_FRONT_BASE_URL?: string;
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
