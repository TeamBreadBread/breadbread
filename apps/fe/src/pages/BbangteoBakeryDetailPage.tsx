import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { BAKERY_REVIEWS_DEFAULT_SIZE, deleteBakeryReview, getBakeryReviews } from "@/api/bakery";
import { isBakeryReviewAuthor, type BakeryReview } from "@/api/types/bakery";
import { getErrorMessage } from "@/api/types/common";
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
import { useBakeryDetail } from "@/hooks/useBakeryDetail";
import { getUserProfile } from "@/lib/userProfileCache";
import type { BakeryDetail, BakeryDetailBread } from "@/api/types/bakery";
import type { BakeryListEntryFrom } from "@/utils/bakeryListEntry";
import { formatInstantInSeoul } from "@/utils/formatSeoulDateTime";
import { buildWeeklyHoursRows, getBakeryHoursStatusLabel } from "@/utils/bakeryBusinessHours";
import BakeryKakaoMapPreview from "@/components/domain/bbangteo/BakeryKakaoMapPreview";
import { formatPhoneDisplay } from "@/utils/formatPhoneNumber";
import { cn } from "@/utils/cn";

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
      search: { from: listEntryFrom, curationPins: [] },
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
            <AppIcon src={IconAssets.IcChevronLeft} size="x6" alt="뒤로가기" />
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

const META_ICON_CLASS = "icon-gray-600";

const BakeryTitleInfo = ({
  name,
  rating,
  reviewCount,
}: {
  name: string;
  rating: number;
  reviewCount: number;
}) => (
  <div className="flex flex-col gap-[10px]">
    <h1 className="text-[22px] leading-[30px] font-bold text-[#1a1c20]">{name}</h1>
    <div className="flex items-center gap-x1 text-[14px] leading-[19px] font-medium text-gray-600">
      <AppIcon src={IconAssets.IcStar} size={18} className="icon-orange-600 shrink-0" alt="" />
      <span>{rating.toFixed(1)}</span>
      <span>·</span>
      <span>후기({reviewCount.toLocaleString("ko-KR")})</span>
    </div>
  </div>
);

const BakeryInfoList = ({ detail }: { detail: BakeryDetail }) => {
  const [mapExpanded, setMapExpanded] = useState(false);
  const [hoursExpanded, setHoursExpanded] = useState(false);
  const statusLabel = getBakeryHoursStatusLabel(detail);
  const weeklyRows = buildWeeklyHoursRows(detail);
  const phoneLabel = formatPhoneDisplay(detail.phone);
  const isOpenNow = statusLabel === "영업 중";

  return (
    <div className="flex flex-col gap-[10px]">
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

const BakeryHero = ({ detail }: { detail: BakeryDetail }) => {
  const rating = detail.rating != null ? Number(detail.rating) : 0;
  const reviewCount = detail.reviewCount != null ? Number(detail.reviewCount) : 0;
  const images = detail.imageUrls ?? [];

  return (
    <section className="flex flex-col">
      <BakeryImageGallery imageUrls={images} bakeryName={detail.name} />
      <div className="flex flex-col gap-[16px] px-[20px] py-[16px]">
        <BakeryTitleInfo name={detail.name} rating={rating} reviewCount={reviewCount} />
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
                      <AppIcon
                        key={idx}
                        src={IconAssets.IcStar}
                        size={12}
                        className={idx < review.rating ? "opacity-100" : "opacity-25"}
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
            search: { from: listEntryFrom, curationPins: [] },
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
  /** 후기 등록 성공 시에만 true — "후기 업로드됨" 토스트 노출 */
  reviewUploaded?: boolean;
  /** 후기 탭을 기본 선택 상태로 열지 여부 (나가기 등 토스트와 무관) */
  reviewTab?: boolean;
};

const BbangteoBakeryDetailPage = ({
  bakeryId,
  listEntryFrom,
  returnCourseId,
  reviewUploaded = false,
  reviewTab = false,
}: BbangteoBakeryDetailPageProps) => {
  const navigate = useNavigate();
  const { data, loading, error } = useBakeryDetail(bakeryId);
  const [isToastClosed, setIsToastClosed] = useState(false);

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
                    search: { from: listEntryFrom, curationPins: [] },
                  });
                }}
              >
                목록으로
              </button>
            </div>
          ) : data ? (
            <>
              <BakeryHero detail={data} />
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
        <div className="fixed bottom-[68px] left-1/2 z-50 w-full max-w-[402px] -translate-x-1/2 sm:bottom-[72px] md:max-w-[744px]">
          <ToastBanner message="후기가 업로드 되었습니다." />
        </div>
      ) : null}
      <BottomNav />
    </MobileFrame>
  );
};

export default BbangteoBakeryDetailPage;
