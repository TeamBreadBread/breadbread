import type { CourseCatalogFilterOption } from "./courseCatalogFilters";

type CourseFilterBarProps = {
  options: CourseCatalogFilterOption[];
  activeValue?: string;
  onChange: (value?: string) => void;
};

const CourseFilterBar = ({ options, activeValue, onChange }: CourseFilterBarProps) => {
  if (options.length === 0) return null;

  return (
    <section className="shrink-0 border-b border-[#eeeff1] bg-white px-[20px] py-[12px]">
      <div className="flex items-center gap-[8px] overflow-x-auto">
        {options.map((option) => {
          const isActive = (option.value ?? undefined) === (activeValue ?? undefined);
          return (
            <button
              key={option.label}
              type="button"
              onClick={() => onChange(option.value)}
              className={
                isActive
                  ? "shrink-0 rounded-[9999px] bg-[#1a1c20] px-[12px] py-[8px] text-[14px] leading-[19px] font-semibold text-white"
                  : "shrink-0 rounded-[9999px] bg-[#f3f4f5] px-[12px] py-[8px] text-[14px] leading-[19px] text-[#1a1c20]"
              }
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default CourseFilterBar;
