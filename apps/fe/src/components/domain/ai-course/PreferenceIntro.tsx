interface PreferenceIntroProps {
  currentStep: number;
  totalStep: number;
  title: string;
  description: string;
}

export default function PreferenceIntro({
  currentStep,
  totalStep,
  title,
  description,
}: PreferenceIntroProps) {
  return (
    <section className="flex flex-col gap-x2-5 overflow-hidden bg-gray-00 px-x5 pb-x6 pt-x9">
      <div className="flex items-center gap-x0-5">
        <span className="font-sans text-size-6 leading-t6 font-medium tracking-2 whitespace-nowrap text-gray-1000">
          {currentStep}
        </span>
        <span className="font-sans text-size-6 leading-t6 font-medium tracking-2 text-gray-600">
          /
        </span>
        <span className="font-sans text-size-6 leading-t6 font-medium tracking-2 whitespace-nowrap text-gray-600">
          {totalStep}
        </span>
      </div>

      <h2 className="font-sans text-size-8 leading-t8 font-bold tracking-2 text-gray-1000">
        {title}
      </h2>

      <p className="font-sans text-size-5 leading-t5 font-regular tracking-2 text-gray-900">
        {description}
      </p>
    </section>
  );
}
