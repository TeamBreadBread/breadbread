import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import ArrowLeft from "@/assets/icons/ArrowLeft.svg";
import ratingStar from "@/assets/icons/ratingStar.svg";
import currationBreadImg from "@/assets/images/Curration_CardBread.png";
import BottomNav from "@/components/layout/BottomNav";
import MobileFrame from "@/components/layout/MobileFrame";

type Bakery = {
  id: number;
  name: string;
  address: string;
  rating: number;
  reviewCount: number;
  bookmarkCount: number;
  images: string[];
};

const bakeries: Bakery[] = [
  {
    id: 1,
    name: "성심당 본점",
    address: "대전 중구 대종로480번길 15",
    rating: 4.5,
    reviewCount: 12836,
    bookmarkCount: 12,
    images: [
      "Frame 473587_4115.png",
      "Frame 17074825803587_4117.png",
      "Frame 17074825813587_4119.png",
      "Frame 17074825823587_4121.png",
    ],
  },
  {
    id: 2,
    name: "땡큐베리머치",
    address: "대전 중구 중교로 49",
    rating: 4.5,
    reviewCount: 8,
    bookmarkCount: 12,
    images: [
      "Frame 473587_4139.png",
      "Frame 17074825803587_4141.png",
      "Frame 17074825813587_4143.png",
      "Frame 17074825823587_4145.png",
    ],
  },
  {
    id: 3,
    name: "땡큐베리머치",
    address: "대전 중구 중교로 49",
    rating: 4.5,
    reviewCount: 8,
    bookmarkCount: 12,
    images: [
      "Frame 473587_4163.png",
      "Frame 17074825803587_4165.png",
      "Frame 17074825813587_4167.png",
      "Frame 17074825823587_4169.png",
    ],
  },
];

const CircleIcon = ({ size = 18, color = "#dcdee3" }: { size?: number; color?: string }) => (
  <div className="rounded-full" style={{ width: size, height: size, backgroundColor: color }} />
);

const PageHeader = ({ title }: { title: string }) => {
  const navigate = useNavigate();
  return (
    <header className="fixed top-0 left-1/2 z-40 flex h-[56px] w-full max-w-[402px] -translate-x-1/2 items-center justify-between border-b border-[#eeeff1] bg-white px-[20px] md:max-w-[744px]">
      <button
        type="button"
        className="flex h-[36px] w-[36px] items-center justify-center text-[22px]"
        onClick={() => navigate({ to: "/bbangteo" })}
      >
        <img src={ArrowLeft} alt="뒤로가기" className="h-[24px] w-[24px]" />
      </button>
      <h1 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[18px] leading-[24px] font-bold text-[#1a1c20]">
        {title}
      </h1>
      <div className="h-[36px] w-[36px]" />
    </header>
  );
};

const FilterChip = ({ label, withIcon = false }: { label: string; withIcon?: boolean }) => (
  <button
    type="button"
    className="flex max-h-[34px] items-center rounded-[9999px] bg-[#f3f4f5] p-[8px]"
  >
    <span className="px-[4px] text-[14px] leading-[19px] text-[#1a1c20]">{label}</span>
    {withIcon ? <CircleIcon size={18} /> : null}
  </button>
);

const SearchFilterSection = ({
  keyword,
  onKeywordChange,
}: {
  keyword: string;
  onKeywordChange: (value: string) => void;
}) => (
  <section className="flex flex-col gap-[16px] bg-white px-[20px] py-[12px]">
    <div className="flex h-[56px] items-center gap-[8px] rounded-[12px] border border-[#dcdee3] px-[20px] py-[16px]">
      <input
        type="search"
        value={keyword}
        onChange={(event) => onKeywordChange(event.target.value)}
        placeholder="빵집을 검색해보세요"
        className="flex-1 bg-transparent text-[16px] leading-[22px] text-[#1a1c20] placeholder:text-[#d1d3d8] outline-none"
      />
      <CircleIcon size={24} />
    </div>
    <div className="flex items-center gap-[8px]">
      <button
        type="button"
        className="flex max-h-[34px] items-center justify-center rounded-[9999px] bg-[#f3f4f5] p-[8px]"
      >
        <CircleIcon size={18} />
      </button>
      <FilterChip label="정렬" withIcon />
      <FilterChip label="영업 중" />
    </div>
  </section>
);

const BakeryMeta = ({
  rating,
  reviewCount,
  bookmarkCount,
}: Pick<Bakery, "rating" | "reviewCount" | "bookmarkCount">) => (
  <div className="flex h-[18px] items-center gap-[4px]">
    <div className="flex items-center gap-[2px]">
      <img src={ratingStar} alt="별점" className="h-[14px] w-[14px]" />
      <span className="text-[13px] leading-[18px] text-[#868b94]">{rating}</span>
      <span className="text-[13px] leading-[18px] text-[#868b94]">
        ({reviewCount.toLocaleString()})
      </span>
    </div>
    <span className="text-[13px] leading-[18px] text-[#868b94]">·</span>
    <div className="flex items-center gap-[2px]">
      <CircleIcon size={14} />
      <span className="text-[13px] leading-[18px] text-[#868b94]">{bookmarkCount}</span>
    </div>
  </div>
);

const BakeryImageRow = ({ images, bakeryName }: { images: string[]; bakeryName: string }) => (
  <div className="w-full overflow-x-auto">
    <div className="flex w-max items-center gap-[6px]">
      {images.map((image, index) => (
        <div
          key={`${image}-${index}`}
          className="flex h-[110px] w-[110px] shrink-0 items-center justify-center rounded-[8px] bg-[#f3f4f5]"
          aria-label={`${bakeryName} 이미지 ${index + 1}`}
        >
          <img src={currationBreadImg} alt="" className="h-[31px] w-[32px] object-contain" />
        </div>
      ))}
    </div>
  </div>
);

const BakeryCard = ({ bakery, onClick }: { bakery: Bakery; onClick?: () => void }) => (
  <article
    className="flex flex-col gap-[12px] border-b border-[#f3f4f5] px-[20px] py-[18px]"
    onClick={onClick}
    onKeyDown={(event) => {
      if (event.key === "Enter" || event.key === " ") {
        onClick?.();
      }
    }}
    role={onClick ? "button" : undefined}
    tabIndex={onClick ? 0 : undefined}
  >
    <div className="flex flex-col gap-[4px]">
      <h2 className="line-clamp-1 text-[18px] leading-[24px] font-medium text-[#1a1c20]">
        {bakery.name}
      </h2>
      <div className="flex flex-col gap-[2px]">
        <p className="line-clamp-1 text-[14px] leading-[19px] text-[#868b94]">{bakery.address}</p>
        <BakeryMeta
          rating={bakery.rating}
          reviewCount={bakery.reviewCount}
          bookmarkCount={bakery.bookmarkCount}
        />
      </div>
    </div>
    <BakeryImageRow images={bakery.images} bakeryName={bakery.name} />
  </article>
);

const BakeryList = ({
  items,
  onItemClick,
}: {
  items: Bakery[];
  onItemClick?: (bakery: Bakery) => void;
}) => (
  <section className="flex flex-col">
    {items.map((bakery) => (
      <BakeryCard
        key={bakery.id}
        bakery={bakery}
        onClick={onItemClick ? () => onItemClick(bakery) : undefined}
      />
    ))}
  </section>
);

const BbangteoBakeryListPage = () => {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");
  const filteredBakeries = useMemo(
    () =>
      bakeries.filter(
        (bakery) => bakery.name.includes(keyword.trim()) || bakery.address.includes(keyword.trim()),
      ),
    [keyword],
  );

  const handleBakeryClick = (bakery: Bakery) => {
    if (bakery.name === "성심당 본점") {
      navigate({ to: "/bbangteo-bakery-detail" });
    }
  };

  return (
    <MobileFrame className="bg-white">
      <div className="flex min-h-screen flex-1 flex-col bg-white">
        <PageHeader title="빵집 리스트" />
        <main className="flex flex-1 flex-col pt-[56px] pb-[56px] sm:pb-[60px]">
          <SearchFilterSection keyword={keyword} onKeywordChange={setKeyword} />
          <BakeryList items={filteredBakeries} onItemClick={handleBakeryClick} />
        </main>
      </div>
      <BottomNav />
    </MobileFrame>
  );
};

export default BbangteoBakeryListPage;
