const CircleIcon = ({ size = 18 }: { size?: number }) => (
  <div className="rounded-full bg-[#dcdee3]" style={{ width: size, height: size }} />
);

const FilterChip = ({ label, withIcon = false }: { label: string; withIcon?: boolean }) => (
  <button
    type="button"
    className="flex max-h-[34px] items-center justify-center rounded-[9999px] bg-[#f3f4f5] p-[8px]"
  >
    <span className="px-[4px] text-[14px] leading-[19px] text-[#1a1c20]">{label}</span>
    {withIcon ? <CircleIcon size={18} /> : null}
  </button>
);

const CourseFilterBar = () => {
  return (
    <section className="h-[58px] shrink-0 bg-white px-[20px] py-[12px]">
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
};

export default CourseFilterBar;
