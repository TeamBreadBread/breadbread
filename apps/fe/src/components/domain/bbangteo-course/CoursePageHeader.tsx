import { useNavigate } from "@tanstack/react-router";
import ArrowLeft from "@/assets/icons/ArrowLeft.svg";

type CoursePageHeaderProps = {
  title: string;
};

const CoursePageHeader = ({ title }: CoursePageHeaderProps) => {
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 left-1/2 z-40 flex h-[56px] w-full max-w-[402px] -translate-x-1/2 items-center justify-between border-b border-[#eeeff1] bg-white px-[20px] md:max-w-[744px]">
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
    </header>
  );
};

export default CoursePageHeader;
