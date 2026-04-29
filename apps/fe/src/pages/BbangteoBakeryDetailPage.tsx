import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import ArrowLeft from "@/assets/icons/ArrowLeft.svg";
import mapIcon from "@/assets/icons/mapIcon.svg";
import ratingStar from "@/assets/icons/ratingStar.svg";
import currationBreadImg from "@/assets/images/Curration_CardBread.png";
import soboroImg from "@/assets/images/soboro.png";
import BottomNav from "@/components/layout/BottomNav";
import MobileFrame from "@/components/layout/MobileFrame";

const bakery = {
  name: "성심당 본점",
  rating: 4.5,
  reviewCount: 1234,
  address: "대전 중구 대종로480번길 15",
  status: "영업 중",
  phone: "042-229-5302",
  images: [
    "Union3606_5681.png",
    "Union3606_5683.png",
    "Union3606_5685.png",
    "Union3606_5687.png",
    "Union3606_5689.png",
  ],
};

type Menu = {
  id: number;
  name: string;
  price: string;
  image?: string;
  soldOut?: boolean;
};

const menus: Menu[] = [
  { id: 1, name: "전설의 팥빙수", price: "6,000", image: "Frame 473606_5737.png" },
  {
    id: 2,
    name: "튀김소보로",
    price: "1,700",
    image: "Frame 17074826343613_2743.png",
    soldOut: true,
  },
  { id: 3, name: "튀소구마", price: "1,700" },
  { id: 4, name: "판타롱부추빵", price: "2,000", image: "Frame 473606_5762.png" },
  { id: 5, name: "보문산메아리", price: "6,000", soldOut: true },
  { id: 6, name: "작은메아리", price: "3,000", image: "Frame 473606_5779.png" },
  { id: 7, name: "성심순크림빵", price: "2,500" },
  { id: 8, name: "소금빵", price: "1,500", image: "Frame 473606_5793.png" },
];

const CircleIcon = ({ size = 18, color = "#dcdee3" }: { size?: number; color?: string }) => (
  <div className="rounded-full" style={{ width: size, height: size, backgroundColor: color }} />
);

const BackHeader = () => {
  const navigate = useNavigate();
  return (
    <header className="fixed top-0 left-1/2 z-40 flex h-[56px] w-full max-w-[402px] -translate-x-1/2 items-center justify-between border-b border-[#eeeff1] bg-white px-[20px] md:max-w-[744px]">
      <button
        type="button"
        className="flex h-[36px] w-[36px] items-center justify-center text-[22px]"
        onClick={() => navigate({ to: "/bbangteo-bakery-list" })}
      >
        <img src={ArrowLeft} alt="뒤로가기" className="h-[24px] w-[24px]" />
      </button>
      <div className="h-[36px] w-[36px]" />
    </header>
  );
};

const BakeryImageGallery = ({ images }: { images: string[] }) => (
  <div className="flex flex-col px-[20px] py-[14px]">
    <div className="flex items-center gap-[10px] overflow-x-auto">
      {images.map((image, index) => (
        <div
          key={`${image}-${index}`}
          className="relative h-[280px] w-[280px] shrink-0 overflow-hidden rounded-[12px] bg-[#f7f8f9]"
        >
          <img
            className="absolute left-1/2 top-1/2 h-[78px] w-[81px] -translate-x-1/2 -translate-y-1/2 object-contain"
            src={currationBreadImg}
            alt={`빵집 이미지 ${index + 1}`}
          />
        </div>
      ))}
    </div>
  </div>
);

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
      <span>리뷰 ({reviewCount.toLocaleString()})</span>
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

const BakeryInfoList = () => (
  <div className="flex flex-col gap-[10px]">
    <BakeryInfoRow icon="address" text={bakery.address} />
    <BakeryInfoRow icon="status" text={bakery.status} />
    <BakeryInfoRow icon="phone" text={bakery.phone} />
  </div>
);

const BakeryHero = () => (
  <section className="flex flex-col">
    <BakeryImageGallery images={bakery.images} />
    <div className="flex flex-col gap-[16px] px-[20px] py-[16px]">
      <BakeryTitleInfo name={bakery.name} rating={bakery.rating} reviewCount={bakery.reviewCount} />
      <BakeryInfoList />
    </div>
  </section>
);

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

const MenuImagePreview = ({ menu }: { menu: Menu }) => {
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

const MenuItem = ({ menu }: { menu: Menu }) => (
  <article
    className={`flex items-start border-b border-[#f3f4f5] py-[16px] ${menu.image ? "gap-[12px]" : ""}`}
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
    {menu.image ? <MenuImagePreview menu={menu} /> : null}
  </article>
);

const MenuList = () => (
  <div className="flex flex-col px-[20px] pb-[20px]">
    {menus.map((menu) => (
      <MenuItem key={menu.id} menu={menu} />
    ))}
  </div>
);

const BakeryTabSection = () => {
  const [activeTab, setActiveTab] = useState<"메뉴" | "후기">("메뉴");
  return (
    <section className="flex flex-col">
      <BakeryTabs activeTab={activeTab} onTabChange={setActiveTab} />
      {activeTab === "메뉴" ? (
        <MenuList />
      ) : (
        <div className="px-[20px] py-[24px] text-[14px] leading-[19px] text-[#868b94]">
          후기는 준비 중입니다.
        </div>
      )}
    </section>
  );
};

const BbangteoBakeryDetailPage = () => {
  return (
    <MobileFrame className="bg-white">
      <div className="flex min-h-screen flex-1 flex-col bg-white">
        <BackHeader />
        <main className="flex flex-1 flex-col pt-[56px] pb-[56px] sm:pb-[60px]">
          <BakeryHero />
          <BakeryTabSection />
        </main>
      </div>
      <BottomNav />
    </MobileFrame>
  );
};

export default BbangteoBakeryDetailPage;
