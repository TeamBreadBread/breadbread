import Skeleton from "@/components/common/skeleton/Skeleton";

// 지금은 회색 박스 하나만 있지만, 나중에 로고나 프로필로 바뀔 가능성이 높아 보여서 따로 뺌
const TopHeader = () => {
  return (
    <header className="flex h-[56px] items-center justify-between bg-white px-5">
      <div className="flex w-[63px] items-center justify-start rounded-[var(--radius-r2)] p-1">
        <Skeleton className="h-[29px] w-full" />
      </div>

      {/* 필요하면 알림/프로필/로고 넣기 */}
      <div />
    </header>
  );
};

export default TopHeader;
