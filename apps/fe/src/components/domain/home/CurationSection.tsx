// 큐레이션 문구 + 더보기 + 큰 하단 콘텐츠 영역
// SectionHeader(제목+더보기) + CurationFooter
import SectionHeader from "@/components/common/section-header/SectionHeader";
import Skeleton from "@/components/common/skeleton/Skeleton";
import CurationFooter from "./CurationFooter";

const CurationSection = () => {
  const handleMoreClick = () => {
    // TODO: 큐레이션 전체보기 라우트 연결
  };

  return (
    <section className="overflow-hidden w-[402px] h-[364px] bg-white px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6">
      <div className="flex flex-col gap-3 sm:gap-4">
        <SectionHeader
          title="큐레이션 문구"
          actionLabel="더보기"
          onActionClick={handleMoreClick}
          icon={<Skeleton shape="circle" className="h-[18px] w-[18px]" />}
        />

        <div className="w-full">
          <CurationFooter />
        </div>
      </div>
    </section>
  );
};

export default CurationSection;
