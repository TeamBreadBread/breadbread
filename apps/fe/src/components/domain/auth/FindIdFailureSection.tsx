interface FindIdFailureSectionProps {
  title: string;
  description: string;
}

export default function FindIdFailureSection({ title, description }: FindIdFailureSectionProps) {
  return (
    <section className="flex flex-col items-center gap-x7 p-x5">
      <div className="h-[100px] w-[100px] shrink-0 bg-gray-300" />

      <div className="flex w-full flex-col items-center gap-x2">
        <h1 className="w-full whitespace-pre-line text-center text-size-7 font-bold leading-t8 tracking-0 text-gray-1000">
          {title}
        </h1>

        <p className="whitespace-pre-line text-center text-size-4 leading-t5 tracking-0 text-gray-700">
          {description}
        </p>
      </div>
    </section>
  );
}
