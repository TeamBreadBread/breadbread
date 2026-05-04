import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import ArrowLeft from "@/assets/icons/ArrowLeft.svg";
import mapIcon from "@/assets/icons/mapIcon.svg";
import ratingStar from "@/assets/icons/ratingStar.svg";
import currationBreadImg from "@/assets/images/Curration_CardBread.png";
import soboroImg from "@/assets/images/soboro.png";
import BottomNav from "@/components/layout/BottomNav";
import MobileFrame from "@/components/layout/MobileFrame";
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

function breadsToMenus(breads: BakeryDetailBread[]): MenuRow[] {
  return breads.map((b) => ({
    id: b.id,
    name: b.name,
    price: b.price.toLocaleString("ko-KR"),
    imageUrl: b.imageUrl,
    soldOut: b.estimatedSoldOut,
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
  const tiles = imageUrls.length > 0 ? imageUrls : [null];
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
            <span className="line-clamp-1 text-[12px] leading-[16px] font-medium text-[#fa342c]">
              🚫 품절됐어요
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

const BakeryTabSection = ({ menus }: { menus: MenuRow[] }) => {
  const [activeTab, setActiveTab] = useState<"메뉴" | "후기">("메뉴");
  return (
    <section className="flex flex-col">
      <BakeryTabs activeTab={activeTab} onTabChange={setActiveTab} />
      {activeTab === "메뉴" ? (
        <MenuList menus={menus} />
      ) : (
        <div className="px-[20px] py-[24px] text-[14px] leading-[19px] text-[#868b94]">
          후기는 준비 중입니다.
        </div>
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
};

const BbangteoBakeryDetailPage = ({ bakeryId, listEntryFrom }: BbangteoBakeryDetailPageProps) => {
  const navigate = useNavigate();
  const { data, loading, error } = useBakeryDetail(bakeryId);

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
              <BakeryTabSection menus={breadsToMenus(data.breads ?? [])} />
            </>
          ) : null}
        </main>
      </div>
      <BottomNav />
    </MobileFrame>
  );
};

export default BbangteoBakeryDetailPage;
