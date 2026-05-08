import {
  BBANGTEO_FIXED_HEADER_OUTER_CLASS,
  FIXED_TOP_BAR_SPACER_CLASS,
} from "@/components/layout/layout.constants";

type BbangteoHeaderProps = {
  title: string;
};

const BbangteoHeader = ({ title }: BbangteoHeaderProps) => {
  return (
    <>
      <header className={BBANGTEO_FIXED_HEADER_OUTER_CLASS}>
        <div className="flex h-[56px] items-center justify-start px-5">
          <h1 className="text-[18px] leading-[24px] font-bold text-[#1a1c20]">{title}</h1>
        </div>
      </header>
      <div className={FIXED_TOP_BAR_SPACER_CLASS} aria-hidden />
    </>
  );
};

export default BbangteoHeader;
