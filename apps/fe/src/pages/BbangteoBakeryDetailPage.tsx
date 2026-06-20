import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  BAKERY_REVIEWS_DEFAULT_SIZE,
  deleteBakeryReview,
  getBakeryById,
  getBakeryReviews,
  likeBakery,
  unlikeBakery,
} from "@/api/bakery";
import { isBakeryReviewAuthor, type BakeryReview } from "@/api/types/bakery";
import { ApiBusinessError, getErrorMessage } from "@/api/types/common";
import { AppIcon, IconAssets } from "@/components/icons";
import currationBreadImg from "@/assets/images/Curration_CardBread.png";
import soboroImg from "@/assets/images/soboro.png";
import BottomNav from "@/components/layout/BottomNav";
import {
  BBANGTEO_FIXED_HEADER_OUTER_CLASS,
  FIXED_TOP_BAR_SPACER_CLASS,
} from "@/components/layout/layout.constants";
import MobileFrame from "@/components/layout/MobileFrame";
import { ToastBanner } from "@/components/common";
import FloatingPlusButton from "@/components/common/FloatingPlusButton";
import { useLoginRequired } from "@/lib/auth/useLoginRequired";
import { setBakeryLikeOverlay } from "@/lib/bakeryLikeLocalCache";
import { patchBakeryInListCaches } from "@/hooks/useBakeries";
import { useBakeryDetail } from "@/hooks/useBakeryDetail";
import { getUserProfile } from "@/lib/userProfileCache";
import type { BakeryDetail, BakeryDetailBread } from "@/api/types/bakery";
import { getBakeryDetailBackTarget, type BakeryListEntryFrom } from "@/utils/bakeryListEntry";
import { formatInstantInSeoul } from "@/utils/formatSeoulDateTime";
import { buildWeeklyHoursRows, getBakeryHoursStatusLabel } from "@/utils/bakeryBusinessHours";
import { resolveProfileImageUrl } from "@/utils/defaultProfileAvatar";
import { SafeImage } from "@/components/common/SafeImage";
import BakeryKakaoMapPreview from "@/components/domain/bbangteo/BakeryKakaoMapPreview";
import CongestionBadge from "@/components/common/CongestionBadge";
import { getBakeryCongestion, type BakeryCongestion } from "@/api/bakery";
import { formatPhoneDisplay } from "@/utils/formatPhoneNumber";
import { cn } from "@/utils/cn";
import {
  formatBakeryRating,
  resolveBakeryRating,
  resolveBakeryReviewCount,
  shouldShowBakeryRating,
} from "@/utils/bakeryRating";

/** 빵집 상세 제목 줄(`22px` / `leading 30px`)과 맞춘 하트 아이콘 */
const BAKERY_TITLE_LIKE_ICON_SIZE = 22;

type MenuRow = {
  id: number;
  name: string;
  price: string;
  imageUrl?: string | null;
  soldOut?: boolean;
};

const MAX_PREVIEW_IMAGES = 4;
const MAX_REVIEW_PREVIEWS = 4;

function breadsToMenus(breads: BakeryDetailBread[], bakeryName?: string): MenuRow[] {
  return breads.map((b) => ({
    id: b.id,
    name: b.name,
    price: b.price.toLocaleString("ko-KR"),
    imageUrl: b.imageUrl,
    soldOut: b.estimatedSoldOut || (bakeryName === "성심당 본점" && b.name.trim() === "튀김소보로"),
  }));
}

const BackHeader = ({
  listEntryFrom,
  returnCourseId,
  trendBreadKeyword,
}: {
  listEntryFrom?: BakeryListEntryFrom;
  returnCourseId?: number;
  trendBreadKeyword?: string;
}) => {
  const navigate = useNavigate();
  const goToList = () => {
    const target = getBakeryDetailBackTarget(listEntryFrom, returnCourseId, trendBreadKeyword);
    void navigate(target);
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
            <AppIcon src={IconAssets.IcChevronLeft} size="x6" alt="뒤로가기" />
          </button>
          <div className="h-[36px] w-[36px]" />
        </div>
      </header>
      <div className={FIXED_TOP_BAR_SPACER_CLASS} aria-hidden />
    </>
  );
};

const BakeryLikeButton = ({
  liked,
  busy,
  onClick,
}: {
  liked: boolean;
  busy: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    aria-label={liked ? "좋아요 취소" : "좋아요"}
    aria-pressed={liked}
    onClick={onClick}
    className={cn(
      "flex h-[30px] w-[30px] shrink-0 items-center justify-center",
      busy && "pointer-events-none",
    )}
  >
    <svg
      width={BAKERY_TITLE_LIKE_ICON_SIZE}
      height={BAKERY_TITLE_LIKE_ICON_SIZE}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className={cn("shrink-0", liked ? "text-orange-600" : "text-gray-1000 opacity-45")}
    >
      <path d="M8.22857 4.5C5.28857 4.5 3 6.93435 3 9.90673C3 11.3141 3.50877 12.4992 4.30354 13.5992C5.08361 14.6789 6.16878 15.7152 7.3608 16.8235L7.36444 16.8269L10.5698 19.7688C10.7179 19.9048 10.8601 20.0352 10.9893 20.1364C11.1311 20.2474 11.304 20.3614 11.5237 20.4287C11.8342 20.5238 12.1658 20.5238 12.4763 20.4287C12.696 20.3614 12.8689 20.2474 13.0107 20.1364C13.1399 20.0352 13.282 19.9048 13.4302 19.7688L16.6356 16.8269L16.6392 16.8235C17.8312 15.7152 18.9164 14.6789 19.6965 13.5992C20.4912 12.4992 21 11.3141 21 9.90673C21 6.93435 18.7114 4.5 15.7714 4.5C14.2779 4.5 12.9451 5.13261 12 6.14668C11.0549 5.13261 9.72212 4.5 8.22857 4.5Z" />
    </svg>
  </button>
);

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
              <SafeImage
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

const META_ICON_CLASS = "icon-gray-600";

const BakeryTitleInfo = ({
  name,
  rating,
  reviewCount,
  liked,
  likeBusy,
  onToggleLike,
}: {
  name: string;
  rating: number;
  reviewCount: number;
  liked: boolean;
  likeBusy: boolean;
  onToggleLike: () => void;
}) => {
  const showRating = shouldShowBakeryRating(reviewCount);

  return (
    <div className="flex flex-col gap-[10px]">
      <div className="flex items-center justify-between gap-x2">
        <h1 className="min-w-0 flex-1 text-[22px] leading-[30px] font-bold text-[#1a1c20]">
          {name}
        </h1>
        <BakeryLikeButton liked={liked} busy={likeBusy} onClick={onToggleLike} />
      </div>
      <div className="flex items-center gap-x1 text-[14px] leading-[19px] font-medium text-gray-600">
        {showRating ? (
          <>
            <AppIcon
              src={IconAssets.IcStar}
              size={18}
              className="icon-orange-600 shrink-0"
              alt=""
            />
            <span>{formatBakeryRating(rating)}</span>
            <span>·</span>
          </>
        ) : null}
        <span>후기({reviewCount.toLocaleString("ko-KR")})</span>
      </div>
    </div>
  );
};

const BakeryInfoList = ({ detail }: { detail: BakeryDetail }) => {
  const [mapExpanded, setMapExpanded] = useState(false);
  const [hoursExpanded, setHoursExpanded] = useState(false);
  const [congestion, setCongestion] = useState<BakeryCongestion | null>(null);
  const statusLabel = getBakeryHoursStatusLabel(detail);
  const weeklyRows = buildWeeklyHoursRows(detail);
  const phoneLabel = formatPhoneDisplay(detail.phone);
  const isOpenNow = statusLabel === "영업 중";

  useEffect(() => {
    let cancelled = false;
    void getBakeryCongestion(detail.id)
      .then((response) => {
        if (!cancelled) setCongestion(response);
      })
      .catch(() => {
        if (!cancelled) setCongestion(null);
      });
    return () => {
      cancelled = true;
    };
  }, [detail.id]);

  return (
    <div className="flex flex-col gap-[10px]">
      {congestion?.level ? (
        <div className="flex items-center gap-[8px]">
          <span className="text-[14px] leading-[19px] font-medium text-gray-600">혼잡도</span>
          <CongestionBadge level={congestion.level} expectedWaitMin={congestion.expectedWaitMin} />
        </div>
      ) : null}
      <div className="flex flex-col">
        <button
          type="button"
          aria-expanded={mapExpanded}
          onClick={() => setMapExpanded((prev) => !prev)}
          className="flex w-full items-center gap-[8px] text-left"
        >
          <AppIcon src={IconAssets.IcPin} size={22} className={META_ICON_CLASS} alt="" />
          <span className="flex-1 text-[16px] leading-[22px] text-[#1a1c20]">{detail.address}</span>
          <AppIcon
            src={IconAssets.IcChevronDown}
            size={22}
            className={cn(META_ICON_CLASS, "transition-transform", mapExpanded && "rotate-180")}
            alt=""
          />
        </button>
        {mapExpanded ? (
          <div className="mt-x2 h-[180px] w-full overflow-hidden rounded-r3 border border-gray-200">
            <BakeryKakaoMapPreview
              name={detail.name}
              address={detail.address}
              lat={detail.lat}
              lng={detail.lng}
              className="h-full w-full"
            />
          </div>
        ) : null}
      </div>

      <div className="flex flex-col">
        <button
          type="button"
          aria-expanded={hoursExpanded}
          onClick={() => setHoursExpanded((prev) => !prev)}
          className="flex w-full items-center gap-[8px] text-left"
        >
          <AppIcon src={IconAssets.IcClock} size={22} className={META_ICON_CLASS} alt="" />
          <span
            className={cn(
              "flex-1 text-[16px] leading-[22px]",
              isOpenNow ? "font-medium text-orange-600" : "text-[#1a1c20]",
            )}
          >
            {statusLabel}
          </span>
          <AppIcon
            src={IconAssets.IcChevronDown}
            size={22}
            className={cn(META_ICON_CLASS, "transition-transform", hoursExpanded && "rotate-180")}
            alt=""
          />
        </button>
        {hoursExpanded ? (
          <ul className="mt-x2 flex flex-col gap-x1 border-t border-gray-200 pt-x2 pl-[30px]">
            {weeklyRows.map((row) => (
              <li
                key={row.label}
                className="flex items-center justify-between gap-x2 text-[14px] leading-[19px] text-gray-700"
              >
                <span className={row.isToday ? "font-semibold text-gray-1000" : undefined}>
                  {row.label}
                </span>
                <span>{row.text}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="flex items-center gap-[8px]">
        <AppIcon src={IconAssets.IcPhone} size={22} className={META_ICON_CLASS} alt="" />
        <span className="flex-1 text-[16px] leading-[22px] text-[#1a1c20]">{phoneLabel}</span>
      </div>
    </div>
  );
};

const BakeryHero = ({
  detail,
  liked,
  likeBusy,
  onToggleLike,
}: {
  detail: BakeryDetail;
  liked: boolean;
  likeBusy: boolean;
  onToggleLike: () => void;
}) => {
  const rating = resolveBakeryRating(detail.rating);
  const reviewCount = resolveBakeryReviewCount(detail.reviewCount);
  const images = detail.imageUrls ?? [];

  return (
    <section className="flex flex-col">
      <BakeryImageGallery imageUrls={images} bakeryName={detail.name} />
      <div className="flex flex-col gap-[16px] px-[20px] py-[16px]">
        <BakeryTitleInfo
          name={detail.name}
          rating={rating}
          reviewCount={reviewCount}
          liked={liked}
          likeBusy={likeBusy}
          onToggleLike={onToggleLike}
        />
        <BakeryInfoList detail={detail} />
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
        <SafeImage src={menu.imageUrl} alt="" className="h-full w-full object-cover" />
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

const ReviewAuthorAvatar = ({
  profileImageUrl,
  seed,
}: {
  profileImageUrl?: string | null;
  seed: string;
}) => {
  const [useFallback, setUseFallback] = useState(false);
  const src = resolveProfileImageUrl(useFallback ? null : profileImageUrl, seed);

  return (
    <SafeImage
      src={src}
      alt=""
      className="h-full w-full object-cover"
      onError={() => {
        setUseFallback(true);
      }}
    />
  );
};

const ReviewCard = ({
  review,
  viewerUserId,
  onEdit,
  onDelete,
}: {
  review: BakeryReview;
  viewerUserId?: number | null;
  onEdit: () => void;
  onDelete: () => void;
}) => {
  const { date, time } = formatInstantInSeoul(review.createdAt);
  const imgs = (review.imageUrls ?? []).slice(0, MAX_REVIEW_PREVIEWS);
  const avatarSeed =
    review.authorUserId != null ? String(review.authorUserId) : review.authorNickname;

  return (
    <article className="flex flex-col gap-[14px]">
      <div className="flex items-start gap-[10px]">
        <div className="h-[40px] w-[40px] shrink-0 overflow-hidden rounded-full border border-[#eeeff1] bg-[#f7f8f9]">
          <ReviewAuthorAvatar
            key={review.id}
            profileImageUrl={review.authorProfileImageUrl}
            seed={avatarSeed}
          />
        </div>
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
                      <AppIcon
                        key={idx}
                        src={IconAssets.IcStar}
                        size={12}
                        className={cn(
                          "icon-orange-600 shrink-0",
                          idx < review.rating ? "opacity-100" : "opacity-25",
                        )}
                      />
                    ))}
                  </div>
                </div>
                <span>{date}</span>
                <span>{time}</span>
              </div>
            </div>
            {isBakeryReviewAuthor(review, viewerUserId) ? (
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
            ) : null}
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
              <SafeImage src={url} alt="" className="h-full w-full object-cover" />
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
  viewerUserId,
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
  viewerUserId?: number | null;
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
            viewerUserId={viewerUserId}
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
  const { requireLogin } = useLoginRequired();
  const viewerUserId = getUserProfile()?.userId;

  const handleWriteReview = useCallback(() => {
    if (bakeryId === undefined) return;
    requireLogin(() => {
      void navigate({
        to: "/bbangteo-bakery-review-write",
        search: { bakeryId, from: listEntryFrom, reviewId: undefined },
      });
    }, "/bbangteo");
  }, [bakeryId, listEntryFrom, navigate, requireLogin]);

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
          <ReviewList
            reviews={reviews}
            totalCount={reviewTotal}
            loading={reviewsLoading}
            error={reviewsError}
            onRetry={loadReviewsFirstPage}
            onEditReview={handleEditReview}
            onDeleteReview={handleDeleteReview}
            viewerUserId={viewerUserId}
            hasNext={hasNextReviews}
            loadingMore={reviewsLoadingMore}
            onLoadMore={loadReviewsNextPage}
          />
          <div className="h-[90px] shrink-0" aria-hidden />
          <FloatingPlusButton ariaLabel="후기 작성" onClick={handleWriteReview} />
        </>
      )}
    </section>
  );
};

const MissingBakeryId = ({
  listEntryFrom,
  returnCourseId,
  trendBreadKeyword,
}: {
  listEntryFrom?: BakeryListEntryFrom;
  returnCourseId?: number;
  trendBreadKeyword?: string;
}) => {
  const navigate = useNavigate();
  const isAiEntry = listEntryFrom === "ai-result";
  const hasTrendBreadList = listEntryFrom === "bbangteo-home" && Boolean(trendBreadKeyword?.trim());
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
          void navigate(
            getBakeryDetailBackTarget(listEntryFrom, returnCourseId, trendBreadKeyword),
          );
        }}
      >
        {isAiEntry
          ? "AI 추천 코스로"
          : hasTrendBreadList
            ? "빵집 목록으로"
            : listEntryFrom === "bbangteo-home"
              ? "빵터로"
              : "빵집 리스트로"}
      </button>
    </div>
  );
};

type BbangteoBakeryDetailPageProps = {
  bakeryId?: number;
  listEntryFrom?: BakeryListEntryFrom;
  returnCourseId?: number;
  /** SNS 트렌드 빵 키워드 — 빵집 목록으로 돌아갈 때 사용 */
  trendBreadKeyword?: string;
  /** 후기 등록 성공 시에만 true — "후기 업로드됨" 토스트 노출 */
  reviewUploaded?: boolean;
  /** 후기 탭을 기본 선택 상태로 열지 여부 (나가기 등 토스트와 무관) */
  reviewTab?: boolean;
};

const BbangteoBakeryDetailPage = ({
  bakeryId,
  listEntryFrom,
  returnCourseId,
  trendBreadKeyword,
  reviewUploaded = false,
  reviewTab = false,
}: BbangteoBakeryDetailPageProps) => {
  const navigate = useNavigate();
  const { requireLogin } = useLoginRequired();
  const { data, loading, error } = useBakeryDetail(bakeryId);
  const [isToastClosed, setIsToastClosed] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [likeBusy, setLikeBusy] = useState(false);
  const likePendingRef = useRef(false);

  useEffect(() => {
    if (!data || likePendingRef.current) return;
    setLiked(Boolean(data.liked));
    setLikeCount(data.likeCount != null ? Number(data.likeCount) : 0);
  }, [data]);

  const syncLikeToList = (entry: { liked: boolean; likeCount: number }) => {
    if (bakeryId === undefined) return;
    setBakeryLikeOverlay(bakeryId, entry);
    patchBakeryInListCaches(bakeryId, entry);
  };

  const performToggleLike = async () => {
    if (bakeryId === undefined || likeBusy || likePendingRef.current) return;
    const wasLiked = liked;
    const prevCount = likeCount;
    likePendingRef.current = true;
    const nextLiked = !wasLiked;
    const optimisticCount = wasLiked ? Math.max(0, prevCount - 1) : prevCount + 1;
    setLiked(nextLiked);
    setLikeCount(optimisticCount);
    syncLikeToList({ liked: nextLiked, likeCount: optimisticCount });
    setLikeBusy(true);
    try {
      if (wasLiked) {
        await unlikeBakery(bakeryId);
      } else {
        await likeBakery(bakeryId);
      }
      setLiked(nextLiked);
      let resolvedCount = optimisticCount;
      try {
        const fresh = await getBakeryById(bakeryId);
        resolvedCount = fresh.likeCount != null ? Number(fresh.likeCount) : optimisticCount;
        setLikeCount(resolvedCount);
      } catch {
        /* 카운트 동기화 실패 시 UI liked 상태는 유지 */
      }
      syncLikeToList({ liked: nextLiked, likeCount: resolvedCount });
    } catch (e) {
      setLiked(wasLiked);
      setLikeCount(prevCount);
      syncLikeToList({ liked: wasLiked, likeCount: prevCount });
      if (e instanceof ApiBusinessError) {
        if (e.status === 409 && !wasLiked) {
          try {
            const fresh = await getBakeryById(bakeryId);
            const resolved = {
              liked: true,
              likeCount: fresh.likeCount != null ? Number(fresh.likeCount) : prevCount + 1,
            };
            setLiked(resolved.liked);
            setLikeCount(resolved.likeCount);
            syncLikeToList(resolved);
          } catch {
            setLiked(true);
            syncLikeToList({ liked: true, likeCount: prevCount + 1 });
          }
          return;
        }
        if (e.status === 400 && wasLiked) {
          try {
            const fresh = await getBakeryById(bakeryId);
            const resolved = {
              liked: false,
              likeCount:
                fresh.likeCount != null ? Number(fresh.likeCount) : Math.max(0, prevCount - 1),
            };
            setLiked(resolved.liked);
            setLikeCount(resolved.likeCount);
            syncLikeToList(resolved);
          } catch {
            setLiked(false);
            syncLikeToList({ liked: false, likeCount: Math.max(0, prevCount - 1) });
          }
          return;
        }
      }
      window.alert(getErrorMessage(e));
    } finally {
      likePendingRef.current = false;
      setLikeBusy(false);
    }
  };

  const handleToggleLike = () => {
    if (bakeryId === undefined) return;
    const returnPath = `/bbangteo-bakery-detail?bakeryId=${bakeryId}`;
    requireLogin(() => {
      void performToggleLike();
    }, returnPath);
  };

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
          <BackHeader
            listEntryFrom={listEntryFrom}
            returnCourseId={returnCourseId}
            trendBreadKeyword={trendBreadKeyword}
          />
          <MissingBakeryId
            listEntryFrom={listEntryFrom}
            returnCourseId={returnCourseId}
            trendBreadKeyword={trendBreadKeyword}
          />
        </div>
        <BottomNav />
      </MobileFrame>
    );
  }

  return (
    <MobileFrame className="bg-white">
      <div className="flex min-h-screen flex-1 flex-col bg-white">
        <BackHeader
          listEntryFrom={listEntryFrom}
          returnCourseId={returnCourseId}
          trendBreadKeyword={trendBreadKeyword}
        />
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
                  void navigate(
                    getBakeryDetailBackTarget(listEntryFrom, returnCourseId, trendBreadKeyword),
                  );
                }}
              >
                목록으로
              </button>
            </div>
          ) : data ? (
            <>
              <BakeryHero
                detail={data}
                liked={liked}
                likeBusy={likeBusy}
                onToggleLike={handleToggleLike}
              />
              <BakeryTabSection
                menus={breadsToMenus(data.breads ?? [], data.name)}
                showReviewTab={reviewTab || reviewUploaded}
                bakeryId={bakeryId}
                listEntryFrom={listEntryFrom}
              />
            </>
          ) : null}
        </main>
      </div>
      {showToast ? (
        <div className="fixed bottom-[68px] left-1/2 z-50 w-full max-w-[402px] -translate-x-1/2 sm:bottom-[72px]">
          <ToastBanner message="후기가 업로드 되었습니다." />
        </div>
      ) : null}
      <BottomNav />
    </MobileFrame>
  );
};

export default BbangteoBakeryDetailPage;
