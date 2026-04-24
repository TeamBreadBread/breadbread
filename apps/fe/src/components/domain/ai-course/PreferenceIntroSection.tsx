interface PreferenceIntroSectionProps {
  title: string;
  description: string;
}

export default function PreferenceIntroSection({
  title,
  description,
}: PreferenceIntroSectionProps) {
  return (
    <section className="bg-white px-x5 pt-x9 pb-x6">
      <h1 className="font-pretendard typo-t8bold text-[#1a1c20] whitespace-pre-line">{title}</h1>

      <p className="mt-x2 font-pretendard typo-t5regular text-[#2a3038]">{description}</p>
    </section>
  );
}
