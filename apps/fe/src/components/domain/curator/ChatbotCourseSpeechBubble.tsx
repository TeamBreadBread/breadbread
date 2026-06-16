import { cn } from "@/utils/cn";
import { CHATBOT_BUBBLE_ABOVE_FAB_CLASS } from "@/components/domain/curator/chatbotFabLayout";

type ChatbotAction = {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary";
  disabled?: boolean;
};

type ChatbotCourseSpeechBubbleProps = {
  title: string;
  subtitle?: string;
  onClose?: () => void;
  onClick?: () => void;
  actions?: ChatbotAction[];
  bubblePositionClass?: string;
  className?: string;
};

export default function ChatbotCourseSpeechBubble({
  title,
  subtitle,
  onClose,
  onClick,
  actions,
  bubblePositionClass = CHATBOT_BUBBLE_ABOVE_FAB_CLASS,
  className,
}: ChatbotCourseSpeechBubbleProps) {
  return (
    <div
      className={cn(
        "pointer-events-auto w-[min(280px,calc(100%-40px))]",
        bubblePositionClass,
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
        {onClose ? (
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
        ) : null}

        <p
          className={cn(
            "font-pretendard text-size-3 font-bold leading-t5 text-gray-00",
            onClose ? "pr-x6" : undefined,
          )}
        >
          {title}
        </p>
        {subtitle ? (
          <p className="mt-x1 pr-x2 font-pretendard text-size-2 leading-t3 text-gray-400">
            {subtitle}
          </p>
        ) : null}

        {actions && actions.length > 0 ? (
          <div className="mt-x3 grid grid-cols-2 gap-x2">
            {actions.map((action) => (
              <button
                key={action.label}
                type="button"
                disabled={action.disabled}
                onClick={(event) => {
                  event.stopPropagation();
                  action.onClick();
                }}
                className={cn(
                  "rounded-r2 px-x2 py-x2 font-pretendard text-size-2 font-bold leading-t3 disabled:opacity-50",
                  action.variant === "primary"
                    ? "bg-orange-600 text-gray-00"
                    : "border border-gray-500 bg-transparent text-gray-200",
                )}
              >
                {action.label}
              </button>
            ))}
          </div>
        ) : null}

        <div
          className="absolute -bottom-[6px] right-[28px] h-[12px] w-[12px] rotate-45 bg-gray-900"
          aria-hidden
        />
      </div>
    </div>
  );
}
