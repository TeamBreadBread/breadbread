/** GET /bakeries 목록 단일 항목 (Nullable·시간 문자열은 실응답 기준) */
export type BakeryListItem = {
  id: number;
  name: string;
  address: string;
  lat?: number | null;
  lng?: number | null;
  thumbnailUrl?: string | null;
  /** 정렬된 매장 이미지 최대 4개 */
  previewImageUrls?: string[] | null;
  /** 4장을 넘는 나머지 이미지 개수 */
  remainingPreviewImageCount?: number | null;
  rating?: number | null;
  openTime?: string | null;
  closeTime?: string | null;
  likeCount?: number | null;
  liked?: boolean | null;
};

/** GET /bakeries */
export type BakeryListResponse = {
  bakeries: BakeryListItem[];
  total: number;
  page: number;
  size: number;
  hasNext: boolean;
};

/** GET /bakeries/{id} — breads 항목 */
export type BakeryDetailBread = {
  id: number;
  name: string;
  price: number;
  imageUrl?: string | null;
  breadType?: string | null;
  signature: boolean;
  estimatedSoldOut: boolean;
};

/** GET /bakeries/{id} */
export type BakeryDetail = {
  id: number;
  name: string;
  address: string;
  lat?: number | null;
  lng?: number | null;
  imageUrls?: string[];
  openTime?: string | null;
  closeTime?: string | null;
  phone?: string | null;
  rating?: number | null;
  breads: BakeryDetailBread[];
  likeCount?: number | null;
  liked?: boolean | null;
};

/** GET /bakeries/ai — breads 간략 타입 */
export type BakeryAiBreadItem = {
  name: string;
  price: number;
  breadType: string;
  signature: boolean;
};

/** GET /bakeries/ai */
export type BakeryForAI = {
  id: number;
  name: string;
  address: string;
  region?: string | null;
  lat?: number | null;
  lng?: number | null;
  rating?: number | null;
  bakeryType?: string | null;
  useTypes?: string[];
  personalities?: string[];
  breads?: BakeryAiBreadItem[];
  imageUrls?: string[];
};

export type BakerySortType = "RATING" | "REVIEW_COUNT" | "LIKE_COUNT";

/** GET /bakeries 쿼리 (백엔드 검색 조건과 동일) */
export type GetBakeriesParams = {
  keyword?: string;
  sort?: BakerySortType;
  open?: boolean;
  region?: string;
  page?: number;
  size?: number;
};
