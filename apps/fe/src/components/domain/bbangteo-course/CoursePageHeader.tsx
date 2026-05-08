import { useNavigate } from "@tanstack/react-router";
import ArrowLeft from "@/assets/icons/ArrowLeft.svg";
import {
  BBANGTEO_FIXED_HEADER_OUTER_CLASS,
  FIXED_TOP_BAR_SPACER_CLASS,
} from "@/components/layout/layout.constants";

type CoursePageHeaderProps = {
  title: string;
};

const CoursePageHeader = ({ title }: CoursePageHeaderProps) => {
  const navigate = useNavigate();

  return (
    <>
      <header className={BBANGTEO_FIXED_HEADER_OUTER_CLASS}>
        <div className="relative flex h-[56px] items-center justify-between px-[20px]">
          <button
            type="button"
            className="flex h-[36px] w-[36px] items-center justify-center"
            onClick={() => navigate({ to: "/bbangteo" })}
          >
            <img src={ArrowLeft} alt="뒤로가기" className="h-[24px] w-[24px]" />
          </button>
          <h1 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[18px] leading-[24px] font-bold text-[#1a1c20]">
            {title}
          </h1>
          <div className="h-[36px] w-[36px] shrink-0" />
        </div>
      </header>
      <div className={FIXED_TOP_BAR_SPACER_CLASS} aria-hidden />
    </>
  );
};

export default CoursePageHeader;
