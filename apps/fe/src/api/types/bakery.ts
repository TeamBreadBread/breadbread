/** GET /api/bakeries 단일 항목 (목록 카드 매핑용, 백엔드 Nullable 필드 대응) */
export type BakeryListItem = {
  id: number;
  name: string;
  address: string;
  lat?: number | null;
  lng?: number | null;
  thumbnailUrl?: string | null;
  rating?: number | null;
  likeCount?: number | null;
};

/** GET /api/bakeries */
export type BakeryListResponse = {
  bakeries: BakeryListItem[];
  total: number;
  page: number;
  size: number;
  hasNext: boolean;
};

/** GET /api/bakeries/{id} — breads 항목 */
export type BakeryDetailBread = {
  id: number;
  name: string;
  price: number;
  imageUrl?: string | null;
  breadType?: string | null;
  signature: boolean;
  estimatedSoldOut: boolean;
};

/** GET /api/bakeries/{id} */
export type BakeryDetail = {
  id: number;
  name: string;
  address: string;
  lat?: number | null;
  lng?: number | null;
  imageUrls?: string[];
  phone?: string | null;
  rating?: number | null;
  breads: BakeryDetailBread[];
};

/** GET /api/bakeries/ai — breads 간략 타입 */
export type BakeryAiBreadItem = {
  name: string;
  price: number;
  breadType: string;
  signature: boolean;
};

/** GET /api/bakeries/ai */
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

/** GET /api/bakeries 쿼리 (백엔드 검색 조건과 동일) */
export type GetBakeriesParams = {
  keyword?: string;
  sort?: BakerySortType;
  open?: boolean;
  region?: string;
  page?: number;
  size?: number;
};
