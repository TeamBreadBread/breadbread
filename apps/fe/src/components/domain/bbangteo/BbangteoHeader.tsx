type BbangteoHeaderProps = {
  title: string;
};

const BbangteoHeader = ({ title }: BbangteoHeaderProps) => {
  return (
    <header className="fixed top-0 left-1/2 z-40 h-[56px] w-full max-w-[402px] -translate-x-1/2 border-b border-[#eeeff1] bg-white px-5 md:max-w-[744px]">
      <div className="flex h-full items-center justify-start">
        <h1 className="text-[18px] leading-[24px] font-bold text-[#1a1c20]">{title}</h1>
      </div>
    </header>
  );
};

export default BbangteoHeader;
