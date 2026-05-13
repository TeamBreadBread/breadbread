import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  BAKERY_REVIEWS_DEFAULT_SIZE,
  deleteBakeryReview,
  getBakeryReviews,
  likeBakery,
  unlikeBakery,
} from "@/api/bakery";
import type { BakeryReview } from "@/api/types/bakery";
import { getErrorMessage } from "@/api/types/common";
import ArrowLeft from "@/assets/icons/ArrowLeft.svg";
import mapIcon from "@/assets/icons/mapIcon.svg";
import ratingStar from "@/assets/icons/ratingStar.svg";
import currationBreadImg from "@/assets/images/Curration_CardBread.png";
import soboroImg from "@/assets/images/soboro.png";
import BottomNav from "@/components/layout/BottomNav";
import {
  BBANGTEO_FIXED_HEADER_OUTER_CLASS,
  FIXED_TOP_BAR_SPACER_CLASS,
} from "@/components/layout/layout.constants";
import MobileFrame from "@/components/layout/MobileFrame";
import { ToastBanner } from "@/components/common";
import { useBakeryDetail } from "@/hooks/useBakeryDetail";
import type { BakeryDetail, BakeryDetailBread } from "@/api/types/bakery";
import type { BakeryListEntryFrom } from "@/utils/bakeryListEntry";
import { formatInstantInSeoul } from "@/utils/formatSeoulDateTime";

type MenuRow = {
  id: number;
  name: string;
  price: string;
  imageUrl?: string | null;
  soldOut?: boolean;
};

const MAX_PREVIEW_IMAGES = 4;
const MAX_REVIEW_PREVIEWS = 4;

function formatClock(value: string | null | undefined): string | null {
  if (value == null || value === "") return null;
  const m = String(value).match(/(\d{1,2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]}` : null;
}

function buildHoursLabel(detail: BakeryDetail): string {
  const open = formatClock(detail.openTime ?? undefined);
  const close = formatClock(detail.closeTime ?? undefined);
  if (open && close) return `오늘 ${open} ~ ${close}`;
  return "영업 시간 정보 없음";
}

function breadsToMenus(breads: BakeryDetailBread[], bakeryName?: string): MenuRow[] {
  return breads.map((b) => ({
    id: b.id,
    name: b.name,
    price: b.price.toLocaleString("ko-KR"),
    imageUrl: b.imageUrl,
    soldOut: b.estimatedSoldOut || (bakeryName === "성심당 본점" && b.name.trim() === "튀김소보로"),
  }));
}

const CircleIcon = ({ size = 18, color = "#dcdee3" }: { size?: number; color?: string }) => (
  <div className="rounded-full" style={{ width: size, height: size, backgroundColor: color }} />
);

const HeartIcon = ({ filled }: { filled: boolean }) => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 24 24"
    aria-hidden
    className={filled ? "text-red-500" : "text-[#b0b3ba]"}
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinejoin="round"
    strokeLinecap="round"
  >
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const BackHeader = ({
  listEntryFrom,
  returnCourseId,
}: {
  listEntryFrom?: BakeryListEntryFrom;
  returnCourseId?: number;
}) => {
  const navigate = useNavigate();
  const goToList = () => {
    if (listEntryFrom === "ai-result") {
      void navigate({
        to: "/ai-search-result",
        search: { courseId: returnCourseId ?? null },
      });
      return;
    }
    void navigate({
      to: "/bbangteo-bakery-list",
      search: { from: listEntryFrom },
    });
  };

  return (
    <>
      <header className={BBANGTEO_FIXED_HEADER_OUTER_CLASS}>
        <div className="flex h-[56px] items-center justify-between px-[20px]">
          <button
            type="button"
            className="flex h-[36px] w-[36px] items-center justify-center text-[22px]"
            onClick={goToList}
          >
            <img src={ArrowLeft} alt="뒤로가기" className="h-[24px] w-[24px]" />
          </button>
          <div className="h-[36px] w-[36px]" />
        </div>
      </header>
      <div className={FIXED_TOP_BAR_SPACER_CLASS} aria-hidden />
    </>
  );
};

const BakeryImageGallery = ({
  imageUrls,
  bakeryName,
}: {
  imageUrls: string[];
  bakeryName: string;
}) => {
  const tiles = [
    ...imageUrls.slice(0, MAX_PREVIEW_IMAGES),
    ...Array.from({ length: Math.max(0, MAX_PREVIEW_IMAGES - imageUrls.length) }, () => null),
  ];
  return (
    <div className="flex flex-col px-[20px] py-[14px]">
      <div className="flex items-center gap-[10px] overflow-x-auto">
        {tiles.map((url, index) => (
          <div
            key={url ?? `ph-${index}`}
            className="relative h-[280px] w-[280px] shrink-0 overflow-hidden rounded-[12px] bg-[#f7f8f9]"
          >
            {url ? (
              <img
                src={url}
                alt={`${bakeryName} 이미지 ${index + 1}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <img
                className="absolute left-1/2 top-1/2 h-[78px] w-[81px] -translate-x-1/2 -translate-y-1/2 object-contain"
                src={currationBreadImg}
                alt={`${bakeryName} 이미지 ${index + 1}`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const BakeryTitleInfo = ({
  name,
  rating,
  likeCount,
  liked,
  onToggleLike,
  likeBusy,
}: {
  name: string;
  rating: number;
  likeCount: number;
  liked: boolean;
  onToggleLike: () => void;
  likeBusy: boolean;
}) => (
  <div className="flex flex-col gap-[10px]">
    <div className="flex items-start justify-between gap-[12px]">
      <h1 className="flex-1 text-[22px] leading-[30px] font-bold text-[#1a1c20]">{name}</h1>
      <button
        type="button"
        aria-label={liked ? "좋아요 취소" : "좋아요"}
        aria-pressed={liked}
        disabled={likeBusy}
        onClick={onToggleLike}
        className="shrink-0 rounded-full p-[4px] disabled:opacity-45"
      >
        <HeartIcon filled={liked} />
      </button>
    </div>
    <div className="flex items-center gap-[4px] text-[14px] leading-[19px] font-medium text-[#868b94]">
      <div className="flex items-center gap-[2px]">
        <span>{rating}</span>
        <div className="flex items-center">
          {Array.from({ length: 5 }).map((_, idx) => (
            <img key={idx} src={ratingStar} alt="별점" className="h-[18px] w-[18px]" />
          ))}
        </div>
      </div>
      <span>·</span>
      <span>찜 ({likeCount.toLocaleString("ko-KR")})</span>
    </div>
  </div>
);

const BakeryInfoRow = ({ icon, text }: { icon: "address" | "status" | "phone"; text: string }) => (
  <div className="flex items-center gap-[8px]">
    {icon === "address" ? (
      <img src={mapIcon} alt="주소" className="h-[22px] w-[22px]" />
    ) : (
      <CircleIcon size={22} />
    )}
    <span className="flex-1 text-[16px] leading-[22px] text-[#1a1c20]">{text}</span>
    <CircleIcon size={22} />
  </div>
);

const BakeryInfoList = ({
  address,
  hoursLabel,
  phoneLabel,
}: {
  address: string;
  hoursLabel: string;
  phoneLabel: string;
}) => (
  <div className="flex flex-col gap-[10px]">
    <BakeryInfoRow icon="address" text={address} />
    <BakeryInfoRow icon="status" text={hoursLabel} />
    <BakeryInfoRow icon="phone" text={phoneLabel} />
  </div>
);

const BakeryHero = ({
  detail,
  liked,
  likeCount,
  onToggleLike,
  likeBusy,
}: {
  detail: BakeryDetail;
  liked: boolean;
  likeCount: number;
  onToggleLike: () => void;
  likeBusy: boolean;
}) => {
  const rating = detail.rating != null ? Number(detail.rating) : 0;
  const phoneLabel = detail.phone?.trim() ? detail.phone : "등록된 전화번호가 없습니다";
  const images = detail.imageUrls ?? [];

  return (
    <section className="flex flex-col">
      <BakeryImageGallery imageUrls={images} bakeryName={detail.name} />
      <div className="flex flex-col gap-[16px] px-[20px] py-[16px]">
        <BakeryTitleInfo
          name={detail.name}
          rating={rating}
          likeCount={likeCount}
          liked={liked}
          onToggleLike={onToggleLike}
          likeBusy={likeBusy}
        />
        <BakeryInfoList
          address={detail.address}
          hoursLabel={buildHoursLabel(detail)}
          phoneLabel={phoneLabel}
        />
      </div>
    </section>
  );
};

const BakeryTabs = ({
  activeTab,
  onTabChange,
}: {
  activeTab: "메뉴" | "후기";
  onTabChange: (tab: "메뉴" | "후기") => void;
}) => (
  <div className="flex items-center justify-between">
    {(["메뉴", "후기"] as const).map((tab) => (
      <button
        key={tab}
        type="button"
        onClick={() => onTabChange(tab)}
        className={`flex h-[56px] flex-1 items-center justify-center border-b px-[20px] py-[8px] ${
          activeTab === tab ? "border-[#1a1c20]" : "border-[#d1d3d8]"
        }`}
      >
        <span
          className={`text-[16px] leading-[22px] text-[#2a3038] ${
            activeTab === tab ? "font-bold" : "font-medium"
          }`}
        >
          {tab}
        </span>
      </button>
    ))}
  </div>
);

const MenuImagePreview = ({ menu }: { menu: MenuRow }) => {
  if (menu.imageUrl) {
    return (
      <div className="relative flex h-[84px] w-[84px] shrink-0 items-center justify-center overflow-hidden bg-gray-100">
        <img src={menu.imageUrl} alt="" className="h-full w-full object-cover" />
      </div>
    );
  }
  if (menu.name === "튀김소보로") {
    return (
      <div className="relative flex h-[84px] w-[84px] shrink-0 items-center justify-center overflow-hidden bg-gray-100">
        <img src={soboroImg} alt="" className="h-[84px] w-[84px] object-contain object-center" />
      </div>
    );
  }

  return (
    <div className="flex h-[84px] w-[84px] shrink-0 items-center justify-center bg-gray-100">
      <img src={currationBreadImg} alt="" className="h-[23px] w-[24px] object-contain" />
    </div>
  );
};

const MenuItem = ({ menu }: { menu: MenuRow }) => {
  const showThumb = Boolean(menu.imageUrl) || menu.name === "튀김소보로";
  return (
    <article
      className={`flex items-start border-b border-[#f3f4f5] py-[16px] ${showThumb ? "gap-[12px]" : ""}`}
    >
      <div className="flex flex-1 flex-col gap-[4px]">
        <h3 className="line-clamp-1 text-[16px] leading-[22px] font-medium text-[#1a1c20]">
          {menu.name}
        </h3>
        <div className="flex items-start">
          <span
            className={`line-clamp-1 text-[16px] leading-[22px] font-bold ${
              menu.soldOut ? "text-[#b0b3ba]" : "text-[#1a1c20]"
            }`}
          >
            {menu.price}
          </span>
          <span
            className={`line-clamp-1 text-[16px] leading-[22px] ${
              menu.soldOut ? "text-[#b0b3ba]" : "text-[#1a1c20]"
            }`}
          >
            원
          </span>
        </div>
        {menu.soldOut ? (
          <div className="flex items-center gap-[2px]">
            <span className="font-pretendard typo-t2medium line-clamp-1 text-red-700">
              🚫품절됐어요
            </span>
          </div>
        ) : null}
      </div>
      {showThumb ? <MenuImagePreview menu={menu} /> : null}
    </article>
  );
};

const MenuList = ({ menus }: { menus: MenuRow[] }) => (
  <div className="flex flex-col px-[20px] pb-[20px]">
    {menus.length === 0 ? (
      <p className="py-[24px] text-[14px] leading-[19px] text-[#868b94]">등록된 메뉴가 없습니다.</p>
    ) : (
      menus.map((menu) => <MenuItem key={menu.id} menu={menu} />)
    )}
  </div>
);

const ReviewCard = ({
  review,
  onEdit,
  onDelete,
}: {
  review: BakeryReview;
  onEdit: () => void;
  onDelete: () => void;
}) => {
  const { date, time } = formatInstantInSeoul(review.createdAt);
  const imgs = (review.imageUrls ?? []).slice(0, MAX_REVIEW_PREVIEWS);

  return (
    <article className="flex flex-col gap-[14px]">
      <div className="flex items-start gap-[10px]">
        <div className="h-[40px] w-[40px] shrink-0 rounded-full border border-[#eeeff1] bg-[#f7f8f9]" />
        <div className="flex flex-1 flex-col gap-[10px]">
          <div className="flex items-start justify-between gap-[10px]">
            <div className="flex flex-col gap-[4px]">
              <p className="text-[13px] leading-[18px] font-bold text-[#1a1c20]">
                {review.authorNickname}
              </p>
              <div className="flex items-center gap-[6px] text-[12px] leading-[16px] text-[#868b94]">
                <div className="flex items-center gap-[2px]">
                  <span>{review.rating}</span>
                  <div className="flex items-center gap-[2px]">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <img
                        key={idx}
                        src={ratingStar}
                        alt=""
                        className={`h-[12px] w-[12px] ${
                          idx < review.rating ? "opacity-100" : "opacity-25"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <span>{date}</span>
                <span>{time}</span>
              </div>
            </div>
            <div className="flex shrink-0 gap-[10px]">
              <button
                type="button"
                className="text-[12px] font-medium text-[#555d6d] underline underline-offset-2"
                onClick={onEdit}
              >
                수정
              </button>
              <button
                type="button"
                className="text-[12px] font-medium text-red-600 underline underline-offset-2"
                onClick={onDelete}
              >
                삭제
              </button>
            </div>
          </div>
          <p className="text-[14px] leading-[19px] text-[#1a1c20]">{review.content}</p>
        </div>
      </div>
      {imgs.length > 0 ? (
        <div className="flex h-[110px] items-center gap-[6px]">
          {imgs.map((url, index) => (
            <div
              key={`${review.id}-img-${index}`}
              className="flex h-[110px] w-[110px] shrink-0 overflow-hidden rounded-[8px] bg-gray-100"
            >
              <img src={url} alt="" className="h-full w-full object-cover" />
            </div>
          ))}
        </div>
      ) : null}
    </article>
  );
};

const ReviewList = ({
  reviews,
  totalCount,
  loading,
  error,
  onRetry,
  onEditReview,
  onDeleteReview,
  hasNext,
  loadingMore,
  onLoadMore,
}: {
  reviews: BakeryReview[];
  /** Swagger `ReviewListResponse.total` */
  totalCount: number;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onEditReview: (review: BakeryReview) => void;
  onDeleteReview: (review: BakeryReview) => void;
  hasNext: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
}) => (
  <section className="flex flex-col gap-[24px] bg-white px-[20px] py-[24px]">
    <div className="flex items-center gap-[10px]">
      <h2 className="text-[20px] leading-[27px] font-bold text-[#1a1c20]">후기</h2>
      <span className="text-[20px] leading-[27px] font-medium text-[#868b94]">
        {totalCount.toLocaleString("ko-KR")}
      </span>
    </div>
    {loading ? <p className="py-[8px] text-[14px] text-[#868b94]">후기를 불러오는 중…</p> : null}
    {error ? (
      <div className="flex flex-col gap-[10px] py-[8px]">
        <p className="text-[14px] text-red-600">{error}</p>
        <button
          type="button"
          className="self-start text-[14px] font-semibold text-[#555d6d] underline"
          onClick={onRetry}
        >
          다시 시도
        </button>
      </div>
    ) : null}
    {!loading && !error && reviews.length === 0 ? (
      <p className="py-[8px] text-[14px] text-[#868b94]">아직 등록된 후기가 없습니다.</p>
    ) : null}
    <div className="flex flex-col gap-[20px]">
      {reviews.map((review, index) => (
        <div key={review.id} className="flex flex-col gap-[20px]">
          <ReviewCard
            review={review}
            onEdit={() => onEditReview(review)}
            onDelete={() => onDeleteReview(review)}
          />
          {index < reviews.length - 1 ? <div className="h-[1px] bg-[#eeeff1]" /> : null}
        </div>
      ))}
    </div>
    {hasNext ? (
      <button
        type="button"
        className="mx-auto mt-[8px] rounded-[10px] border border-[#dcdee3] px-[20px] py-[12px] text-[14px] font-semibold text-[#1a1c20] disabled:opacity-50"
        disabled={loadingMore}
        onClick={() => onLoadMore()}
      >
        {loadingMore ? "불러오는 중…" : "후기 더 보기"}
      </button>
    ) : null}
  </section>
);

const BakeryTabSection = ({
  menus,
  showReviewTab = false,
  bakeryId,
  listEntryFrom,
}: {
  menus: MenuRow[];
  showReviewTab?: boolean;
  bakeryId?: number;
  listEntryFrom?: BakeryListEntryFrom;
}) => {
  const [activeTab, setActiveTab] = useState<"메뉴" | "후기">(showReviewTab ? "후기" : "메뉴");
  const [reviews, setReviews] = useState<BakeryReview[]>([]);
  const [reviewTotal, setReviewTotal] = useState(0);
  const [reviewPage, setReviewPage] = useState(0);
  const [hasNextReviews, setHasNextReviews] = useState(false);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsLoadingMore, setReviewsLoadingMore] = useState(false);
  const [reviewsError, setReviewsError] = useState<string | null>(null);
  const navigate = useNavigate();

  const loadReviewsFirstPage = useCallback(async () => {
    if (bakeryId === undefined) return;
    setReviewsLoading(true);
    setReviewsLoadingMore(false);
    setReviewsError(null);
    try {
      const res = await getBakeryReviews(bakeryId, {
        sort: "LATEST",
        page: 0,
        size: BAKERY_REVIEWS_DEFAULT_SIZE,
      });
      setReviews(res.reviews);
      setReviewTotal(res.total);
      setReviewPage(0);
      setHasNextReviews(res.hasNext);
    } catch (e) {
      setReviewsError(getErrorMessage(e));
    } finally {
      setReviewsLoading(false);
    }
  }, [bakeryId]);

  const loadReviewsNextPage = useCallback(async () => {
    if (bakeryId === undefined || !hasNextReviews || reviewsLoadingMore || reviewsLoading) return;
    const nextPage = reviewPage + 1;
    setReviewsLoadingMore(true);
    setReviewsError(null);
    try {
      const res = await getBakeryReviews(bakeryId, {
        sort: "LATEST",
        page: nextPage,
        size: BAKERY_REVIEWS_DEFAULT_SIZE,
      });
      setReviews((prev) => [...prev, ...res.reviews]);
      setReviewPage(nextPage);
      setHasNextReviews(res.hasNext);
    } catch (e) {
      setReviewsError(getErrorMessage(e));
    } finally {
      setReviewsLoadingMore(false);
    }
  }, [bakeryId, hasNextReviews, reviewPage, reviewsLoading, reviewsLoadingMore]);

  useEffect(() => {
    if (activeTab === "후기" && bakeryId !== undefined) {
      void loadReviewsFirstPage();
    }
  }, [activeTab, bakeryId, loadReviewsFirstPage]);

  const handleDeleteReview = useCallback(
    (review: BakeryReview) => {
      if (bakeryId === undefined) return;
      if (!window.confirm("이 후기를 삭제할까요?")) return;
      void (async () => {
        try {
          await deleteBakeryReview(bakeryId, review.id);
          await loadReviewsFirstPage();
        } catch (e) {
          alert(getErrorMessage(e));
        }
      })();
    },
    [bakeryId, loadReviewsFirstPage],
  );

  const handleEditReview = useCallback(
    (review: BakeryReview) => {
      void navigate({
        to: "/bbangteo-bakery-review-write",
        search: { bakeryId, from: listEntryFrom, reviewId: review.id },
      });
    },
    [bakeryId, listEntryFrom, navigate],
  );

  return (
    <section className="flex flex-col">
      <BakeryTabs activeTab={activeTab} onTabChange={setActiveTab} />
      {activeTab === "메뉴" ? (
        <MenuList menus={menus} />
      ) : (
        <>
          <div className="px-[20px] py-[16px]">
            <button
              type="button"
              className="flex w-full items-center gap-[10px] rounded-[8px] bg-[#eff6ff] px-[16px] py-[18px]"
              onClick={() =>
                void navigate({
                  to: "/bbangteo-bakery-review-write",
                  search: { bakeryId, from: listEntryFrom, reviewId: undefined },
                })
              }
            >
              <CircleIcon size={24} />
              <span className="flex-1 text-left text-[16px] leading-[22px] font-bold text-[#1a1c20]">
                후기 작성하기
              </span>
              <CircleIcon size={24} />
            </button>
          </div>
          <ReviewList
            reviews={reviews}
            totalCount={reviewTotal}
            loading={reviewsLoading}
            error={reviewsError}
            onRetry={loadReviewsFirstPage}
            onEditReview={handleEditReview}
            onDeleteReview={handleDeleteReview}
            hasNext={hasNextReviews}
            loadingMore={reviewsLoadingMore}
            onLoadMore={loadReviewsNextPage}
          />
        </>
      )}
    </section>
  );
};

const MissingBakeryId = ({
  listEntryFrom,
  returnCourseId,
}: {
  listEntryFrom?: BakeryListEntryFrom;
  returnCourseId?: number;
}) => {
  const navigate = useNavigate();
  const isAiEntry = listEntryFrom === "ai-result";
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-[24px] pb-[56px] text-center">
      <p className="text-[15px] leading-[22px] text-[#1a1c20]">빵집을 찾을 수 없습니다.</p>
      <p className="text-[14px] leading-[19px] text-[#868b94]">
        목록에서 빵집을 다시 선택해 주세요.
      </p>
      <button
        type="button"
        className="rounded-[10px] bg-[#1a1c20] px-5 py-3 text-[15px] font-semibold text-white"
        onClick={() => {
          if (isAiEntry) {
            void navigate({
              to: "/ai-search-result",
              search: { courseId: returnCourseId ?? null },
            });
            return;
          }
          void navigate({
            to: "/bbangteo-bakery-list",
            search: { from: listEntryFrom },
          });
        }}
      >
        {isAiEntry ? "AI 추천 코스로" : "빵집 리스트로"}
      </button>
    </div>
  );
};

type BbangteoBakeryDetailPageProps = {
  bakeryId?: number;
  listEntryFrom?: BakeryListEntryFrom;
  returnCourseId?: number;
  reviewUploaded?: boolean;
};

const BbangteoBakeryDetailPage = ({
  bakeryId,
  listEntryFrom,
  returnCourseId,
  reviewUploaded = false,
}: BbangteoBakeryDetailPageProps) => {
  const navigate = useNavigate();
  const { data, loading, error } = useBakeryDetail(bakeryId);
  const [isToastClosed, setIsToastClosed] = useState(false);
  const [likeState, setLikeState] = useState<{ liked: boolean; count: number } | null>(null);
  const [likeBusy, setLikeBusy] = useState(false);

  useEffect(() => {
    if (data) {
      setLikeState({ liked: Boolean(data.liked), count: data.likeCount ?? 0 });
    } else {
      setLikeState(null);
    }
  }, [data]);

  const handleToggleLike = useCallback(async () => {
    if (bakeryId === undefined || likeBusy || likeState === null) return;
    setLikeBusy(true);
    try {
      if (likeState.liked) {
        await unlikeBakery(bakeryId);
        setLikeState((s) => (s ? { liked: false, count: Math.max(0, s.count - 1) } : s));
      } else {
        await likeBakery(bakeryId);
        setLikeState((s) => (s ? { liked: true, count: s.count + 1 } : s));
      }
    } catch (e) {
      if (axios.isAxiosError(e)) {
        const st = e.response?.status;
        if (st === 409 && !likeState.liked) {
          setLikeState((s) => (s ? { liked: true, count: s.count } : s));
          return;
        }
        if (st === 400 && likeState.liked) {
          setLikeState((s) => (s ? { liked: false, count: s.count } : s));
          return;
        }
      }
      alert(getErrorMessage(e));
    } finally {
      setLikeBusy(false);
    }
  }, [bakeryId, likeBusy, likeState]);

  useEffect(() => {
    if (!reviewUploaded || isToastClosed) return;
    const timer = window.setTimeout(() => setIsToastClosed(true), 2000);
    return () => window.clearTimeout(timer);
  }, [reviewUploaded, isToastClosed]);

  const showToast = reviewUploaded && !isToastClosed;

  if (bakeryId === undefined) {
    return (
      <MobileFrame className="bg-white">
        <div className="flex min-h-screen flex-1 flex-col bg-white">
          <BackHeader listEntryFrom={listEntryFrom} returnCourseId={returnCourseId} />
          <MissingBakeryId listEntryFrom={listEntryFrom} returnCourseId={returnCourseId} />
        </div>
        <BottomNav />
      </MobileFrame>
    );
  }

  return (
    <MobileFrame className="bg-white">
      <div className="flex min-h-screen flex-1 flex-col bg-white">
        <BackHeader listEntryFrom={listEntryFrom} returnCourseId={returnCourseId} />
        <main className="flex flex-1 flex-col pb-[56px] sm:pb-[60px]">
          {loading ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 px-[20px] py-[40px] text-[14px] text-[#868b94]">
              불러오는 중…
            </div>
          ) : error ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 px-[20px] py-[40px] text-center">
              <p className="text-[14px] text-[#868b94]">{error.message}</p>
              <button
                type="button"
                className="rounded-[10px] bg-[#f3f4f5] px-4 py-2 text-[14px] font-semibold text-[#1a1c20]"
                onClick={() => {
                  if (listEntryFrom === "ai-result") {
                    void navigate({
                      to: "/ai-search-result",
                      search: { courseId: returnCourseId ?? null },
                    });
                    return;
                  }
                  void navigate({
                    to: "/bbangteo-bakery-list",
                    search: { from: listEntryFrom },
                  });
                }}
              >
                목록으로
              </button>
            </div>
          ) : data ? (
            <>
              <BakeryHero
                detail={data}
                liked={likeState?.liked ?? Boolean(data.liked)}
                likeCount={likeState?.count ?? data.likeCount ?? 0}
                onToggleLike={() => void handleToggleLike()}
                likeBusy={likeBusy}
              />
              <BakeryTabSection
                menus={breadsToMenus(data.breads ?? [], data.name)}
                showReviewTab={reviewUploaded}
                bakeryId={bakeryId}
                listEntryFrom={listEntryFrom}
              />
            </>
          ) : null}
        </main>
      </div>
      {showToast ? (
        <div className="fixed bottom-[68px] left-1/2 z-50 w-full max-w-[402px] -translate-x-1/2 sm:bottom-[72px] md:max-w-[744px]">
          <ToastBanner message="후기가 업로드 되었습니다." />
        </div>
      ) : null}
      <BottomNav />
    </MobileFrame>
  );
};

export default BbangteoBakeryDetailPage;
