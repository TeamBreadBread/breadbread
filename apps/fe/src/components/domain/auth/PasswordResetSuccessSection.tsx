import { cn } from "@/utils/cn";
interface PasswordResetSuccessSectionProps {
  title: string;
  description: string;
}

export default function PasswordResetSuccessSection({
  title,
  description,
}: PasswordResetSuccessSectionProps) {
  return (
    <section className={cn("flex flex-1 flex-col items-center justify-start px-0 pb-0 pt-[156px]")}>
      <div className={cn("flex w-full flex-col items-center gap-[28px] p-[20px]")}>
        <div className={cn("h-[100px] w-[100px] shrink-0 bg-gray-300")} />

        <div className={cn("flex w-full flex-col items-center gap-[8px]")}>
          <h1
            className={cn(
              "w-full text-center text-[22px] font-bold leading-[30px] tracking-[0] text-gray-1000",
            )}
          >
            {title}
          </h1>

          <p
            className={cn(
              "w-full whitespace-pre-line text-center text-[16px] leading-[22px] tracking-[0] text-gray-700",
            )}
          >
            {description}
          </p>
        </div>
      </div>
    </section>
  );
}
