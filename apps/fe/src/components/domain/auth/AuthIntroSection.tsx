import { cn } from "@/utils/cn";

interface AuthIntroSectionProps {
  title: string;
  description: string;
  titleClassName?: string;
}

export default function AuthIntroSection({
  title,
  description,
  titleClassName,
}: AuthIntroSectionProps) {
  return (
    <section className="flex flex-col items-center gap-x2 px-x5">
      <h1 className={cn("w-full text-center text-gray-1000", titleClassName ?? "typo-t8bold")}>
        {title}
      </h1>

      <p className="w-full text-center text-size-4 font-normal leading-t5 tracking-1 text-gray-700">
        {description}
      </p>
    </section>
  );
}
