import { cn } from "@/utils/cn";

/** 플로팅 버튼(right 20px, bottom 76/80px, 76px — Img_ChatBot.svg 자체) 바로 위 4px */
export const CHATBOT_FAB_SIZE = 76;

export const CHATBOT_FAB_POSITION_CLASS =
  "fixed right-[20px] bottom-[76px] z-[70] sm:bottom-[80px] md:right-[calc((100vw-402px)/2+20px)]";

export const CHATBOT_BUBBLE_ABOVE_FAB_CLASS =
  "fixed right-[20px] bottom-[156px] z-[72] sm:bottom-[160px] md:right-[calc((100vw-402px)/2+20px)]";

type ChatbotCourseSpeechBubbleProps = {
  title: string;
  subtitle: string;
  onClose: () => void;
  onClick?: () => void;
  className?: string;
};

export default function ChatbotCourseSpeechBubble({
  title,
  subtitle,
  onClose,
  onClick,
  className,
}: ChatbotCourseSpeechBubbleProps) {
  return (
    <div
      className={cn(
        "pointer-events-auto w-[min(280px,calc(100%-40px))]",
        CHATBOT_BUBBLE_ABOVE_FAB_CLASS,
        className,
      )}
    >
      <div
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : undefined}
        onClick={onClick}
        onKeyDown={
          onClick
            ? (event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onClick();
                }
              }
            : undefined
        }
        className={cn(
          "relative rounded-r3 bg-gray-900 px-x4 py-x3 shadow-[0_8px_24px_rgba(0,0,0,0.28)]",
          onClick ? "cursor-pointer" : undefined,
        )}
      >
        <button
          type="button"
          aria-label="말풍선 닫기"
          onClick={(event) => {
            event.stopPropagation();
            onClose();
          }}
          className="absolute right-x2 top-x2 flex h-x6 w-x6 items-center justify-center rounded-full text-size-3 text-gray-400 hover:bg-white/10"
        >
          ✕
        </button>

        <p className="pr-x6 font-pretendard text-size-3 font-bold leading-t5 text-gray-00">
          {title}
        </p>
        <p className="mt-x1 pr-x2 font-pretendard text-size-2 leading-t3 text-gray-400">
          {subtitle}
        </p>

        <div
          className="absolute -bottom-[6px] right-[28px] h-[12px] w-[12px] rotate-45 bg-gray-900"
          aria-hidden
        />
      </div>
    </div>
  );
}
