import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import ArrowLeft from "@/assets/icons/ArrowLeft.svg";
import mapIcon from "@/assets/icons/mapIcon.svg";
import ratingStar from "@/assets/icons/ratingStar.svg";
import currationBreadImg from "@/assets/images/Curration_CardBread.png";
import soboroImg from "@/assets/images/soboro.png";
import BottomNav from "@/components/layout/BottomNav";
import MobileFrame from "@/components/layout/MobileFrame";
import { ToastBanner } from "@/components/common";
import { useBakeryDetail } from "@/hooks/useBakeryDetail";
import type { BakeryDetail, BakeryDetailBread } from "@/api/types/bakery";
import type { BakeryListEntryFrom } from "@/utils/bakeryListEntry";

type MenuRow = {
  id: number;
  name: string;
  price: string;
  imageUrl?: string | null;
  soldOut?: boolean;
};

type ReviewRow = {
  id: number;
  nickname: string;
  rating: number;
  date: string;
  time: string;
  content: string;
  images: string[];
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

const fallbackReviewImages = [currationBreadImg, soboroImg, currationBreadImg, soboroImg];

function buildMockReviews(): ReviewRow[] {
  return Array.from({ length: 3 }).map((_, idx) => ({
    id: idx + 1,
    nickname: "바삭바삭한 휘낭시에",
    rating: 4.3,
    date: "2026.04.29",
    time: "15:24",
    content:
      "매장 들어서자마자 빵 냄새에 행복해짐..ㅠㅠ 본점이라 그런지 분위기도 좋고 빵 고르는 재미가 쏠쏠해요. 대전 여행 중 가장 만족스러웠던 곳!",
    images: fallbackReviewImages,
  }));
}

const CircleIcon = ({ size = 18, color = "#dcdee3" }: { size?: number; color?: string }) => (
  <div className="rounded-full" style={{ width: size, height: size, backgroundColor: color }} />
);

const BackHeader = ({ listEntryFrom }: { listEntryFrom?: BakeryListEntryFrom }) => {
  const navigate = useNavigate();
  const goToList = () => {
    void navigate({
      to: "/bbangteo-bakery-list",
      search: { from: listEntryFrom },
    });
  };

  return (
    <header className="fixed top-0 left-1/2 z-40 flex h-[56px] w-full max-w-[402px] -translate-x-1/2 items-center justify-between border-b border-[#eeeff1] bg-white px-[20px] md:max-w-[744px]">
      <button
        type="button"
        className="flex h-[36px] w-[36px] items-center justify-center text-[22px]"
        onClick={goToList}
      >
        <img src={ArrowLeft} alt="뒤로가기" className="h-[24px] w-[24px]" />
      </button>
      <div className="h-[36px] w-[36px]" />
    </header>
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
}: {
  name: string;
  rating: number;
  likeCount: number;
}) => (
  <div className="flex flex-col gap-[10px]">
    <h1 className="text-[22px] leading-[30px] font-bold text-[#1a1c20]">{name}</h1>
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

const BakeryHero = ({ detail }: { detail: BakeryDetail }) => {
  const rating = detail.rating != null ? Number(detail.rating) : 0;
  const likeCount = detail.likeCount ?? 0;
  const phoneLabel = detail.phone?.trim() ? detail.phone : "등록된 전화번호가 없습니다";
  const images = detail.imageUrls ?? [];

  return (
    <section className="flex flex-col">
      <BakeryImageGallery imageUrls={images} bakeryName={detail.name} />
      <div className="flex flex-col gap-[16px] px-[20px] py-[16px]">
        <BakeryTitleInfo name={detail.name} rating={rating} likeCount={likeCount} />
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

const ReviewCard = ({ review }: { review: ReviewRow }) => (
  <article className="flex flex-col gap-[14px]">
    <div className="flex items-start gap-[10px]">
      <div className="h-[40px] w-[40px] shrink-0 rounded-full border border-[#eeeff1] bg-[#f7f8f9]" />
      <div className="flex flex-1 flex-col gap-[10px]">
        <div className="flex items-start justify-between gap-[10px]">
          <div className="flex flex-col gap-[4px]">
            <p className="text-[13px] leading-[18px] font-bold text-[#1a1c20]">{review.nickname}</p>
            <div className="flex items-center gap-[6px] text-[12px] leading-[16px] text-[#868b94]">
              <div className="flex items-center gap-[2px]">
                <span>{review.rating}</span>
                <div className="flex items-center gap-[2px]">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <img key={idx} src={ratingStar} alt="별점" className="h-[12px] w-[12px]" />
                  ))}
                </div>
              </div>
              <span>{review.date}</span>
              <span>{review.time}</span>
            </div>
          </div>
          <CircleIcon size={24} />
        </div>
        <p className="text-[14px] leading-[19px] text-[#1a1c20]">{review.content}</p>
      </div>
    </div>
    <div className="flex h-[110px] items-center gap-[6px]">
      {review.images.slice(0, MAX_REVIEW_PREVIEWS).map((_, index) => (
        <div
          key={`${review.id}-${index}`}
          className="flex h-[110px] w-[110px] items-center justify-center rounded-[8px] bg-gray-100"
        >
          <img
            src={currationBreadImg}
            alt={`후기 미리보기 ${index + 1}`}
            className="h-[31px] w-[32px]"
          />
        </div>
      ))}
    </div>
  </article>
);

const ReviewList = ({ reviews }: { reviews: ReviewRow[] }) => (
  <section className="flex flex-col gap-[24px] bg-white px-[20px] py-[24px]">
    <div className="flex items-center gap-[10px]">
      <h2 className="text-[20px] leading-[27px] font-bold text-[#1a1c20]">후기</h2>
      <span className="text-[20px] leading-[27px] font-medium text-[#868b94]">
        {reviews.length.toLocaleString("ko-KR")}
      </span>
    </div>
    <div className="flex flex-col gap-[20px]">
      {reviews.map((review, index) => (
        <div key={review.id} className="flex flex-col gap-[20px]">
          <ReviewCard review={review} />
          {index < reviews.length - 1 ? <div className="h-[1px] bg-[#eeeff1]" /> : null}
        </div>
      ))}
    </div>
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
  const reviews = useMemo(() => buildMockReviews(), []);
  const navigate = useNavigate();

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
                  search: { bakeryId, from: listEntryFrom },
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
          <ReviewList reviews={reviews} />
        </>
      )}
    </section>
  );
};

const MissingBakeryId = ({ listEntryFrom }: { listEntryFrom?: BakeryListEntryFrom }) => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-[24px] pt-[56px] pb-[56px] text-center">
      <p className="text-[15px] leading-[22px] text-[#1a1c20]">빵집을 찾을 수 없습니다.</p>
      <p className="text-[14px] leading-[19px] text-[#868b94]">
        목록에서 빵집을 다시 선택해 주세요.
      </p>
      <button
        type="button"
        className="rounded-[10px] bg-[#1a1c20] px-5 py-3 text-[15px] font-semibold text-white"
        onClick={() =>
          void navigate({
            to: "/bbangteo-bakery-list",
            search: { from: listEntryFrom },
          })
        }
      >
        빵집 리스트로
      </button>
    </div>
  );
};

type BbangteoBakeryDetailPageProps = {
  bakeryId?: number;
  listEntryFrom?: BakeryListEntryFrom;
  reviewUploaded?: boolean;
};

const BbangteoBakeryDetailPage = ({
  bakeryId,
  listEntryFrom,
  reviewUploaded = false,
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
          <BackHeader listEntryFrom={listEntryFrom} />
          <MissingBakeryId listEntryFrom={listEntryFrom} />
        </div>
        <BottomNav />
      </MobileFrame>
    );
  }

  return (
    <MobileFrame className="bg-white">
      <div className="flex min-h-screen flex-1 flex-col bg-white">
        <BackHeader listEntryFrom={listEntryFrom} />
        <main className="flex flex-1 flex-col pt-[56px] pb-[56px] sm:pb-[60px]">
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
                onClick={() =>
                  void navigate({
                    to: "/bbangteo-bakery-list",
                    search: { from: listEntryFrom },
                  })
                }
              >
                목록으로
              </button>
            </div>
          ) : data ? (
            <>
              <BakeryHero detail={data} />
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
