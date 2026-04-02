// 공통 오버레이 푸터 (다른 페이지/컴포넌트에서 범용으로 사용)
import { cn } from "@/utils/cn";
import "./OverlayFooter.css";

type OverlayFooterProps = {
  title: string;
  description?: string;
  imageUrl?: string;
  className?: string;
};

const OverlayFooter = ({ title, description, imageUrl, className }: OverlayFooterProps) => {
  const hasImage = Boolean(imageUrl);

  return (
    <div
      className={cn(
        "overlay-footer-root relative w-full overflow-hidden rounded-r3",
        "sm:rounded-r3-5",
        "md:rounded-r4",
        className,
      )}
    >
      {hasImage ? (
        <img src={imageUrl} alt={title} className="h-full w-full object-cover" loading="lazy" />
      ) : (
        <div className="h-full w-full bg-gray-300" />
      )}

      {hasImage && <div className="absolute inset-0 bg-gray-1000/25" />}

      <div
        className={cn(
          "absolute inset-x-0 bottom-0 p-x4",
          "sm:p-x5",
          "md:p-x6",
          "lg:p-x7",
          hasImage ? "text-white" : "text-gray-1000",
        )}
      >
        <div className="overlay-footer-content">
          <p
            className={cn(
              "text-size-5 leading-t6 font-bold tracking-2",
              "sm:text-size-7 sm:leading-t8",
              "md:text-size-8 md:leading-t9",
              "lg:text-size-9 lg:leading-t10",
            )}
          >
            {title}
          </p>
          {description && (
            <p
              className={cn(
                "mt-x1 text-size-2 leading-t3 font-medium",
                "sm:text-size-3 sm:leading-t4",
                "md:mt-x2 md:text-size-4 md:leading-t5",
                "lg:text-size-4 lg:leading-t5",
                hasImage ? "text-white/90" : "text-gray-800",
              )}
            >
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default OverlayFooter;
