interface FindIdFailureSectionProps {
  title: string;
  description: string;
}

export default function FindIdFailureSection({ title, description }: FindIdFailureSectionProps) {
  return (
    <section className="flex flex-col items-center gap-[28px] p-[20px]">
      <div className="h-[100px] w-[100px] shrink-0 bg-[#eeeff1]" />

      <div className="flex w-full flex-col items-center gap-[8px]">
        <h1 className="w-full whitespace-pre-line text-center text-[22px] font-bold leading-[30px] tracking-[0] text-[#1a1c20]">
          {title}
        </h1>

        <p className="whitespace-pre-line text-center text-[16px] leading-[22px] tracking-[0] text-[#868b94]">
          {description}
        </p>
      </div>
    </section>
  );
}
