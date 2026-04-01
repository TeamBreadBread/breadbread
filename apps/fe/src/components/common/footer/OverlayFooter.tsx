// 공통 오버레이 푸터 (다른 페이지/컴포넌트에서 범용으로 사용)

type OverlayFooterProps = {
  title: string;
  description?: string;
  imageUrl?: string;
  className?: string;
};

const OverlayFooter = ({ title, description, imageUrl, className }: OverlayFooterProps) => {
  return (
    <div
      className={`relative w-full min-h-[220px] overflow-hidden rounded-[var(--radius-r3)] aspect-[16/10] sm:rounded-[var(--radius-r3-5)] md:rounded-[var(--radius-r4)] md:aspect-[21/10] lg:aspect-[5/2] ${className ?? ""}`}
    >
      {imageUrl ? (
        <img src={imageUrl} alt={title} className="h-full w-full object-cover" loading="lazy" />
      ) : (
        <div className="h-full w-full bg-gray-300" />
      )}

      {imageUrl && <div className="absolute inset-0 bg-black/25" />}

      <div className="absolute inset-x-0 bottom-0 p-4 text-white sm:p-5 md:p-6 lg:p-7">
        <div className="max-w-[85%] md:max-w-[78%] lg:max-w-[70%]">
          <p className="text-[18px] leading-[24px] font-bold tracking-[-0.02em] sm:text-[21px] sm:leading-[28px] md:text-[24px] md:leading-[32px] lg:text-[27px] lg:leading-[35px]">
            {title}
          </p>
          {description && (
            <p className="mt-1 text-[13px] leading-[18px] font-medium text-white/90 sm:text-[14px] sm:leading-[20px] md:mt-2 md:text-[15px] md:leading-[21px] lg:text-[16px] lg:leading-[23px]">
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default OverlayFooter;
