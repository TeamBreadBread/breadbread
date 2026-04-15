interface AuthIntroSectionProps {
  title: string;
  description: string;
}

export default function AuthIntroSection({ title, description }: AuthIntroSectionProps) {
  return (
    <section className="flex flex-col items-center gap-x2 px-x5">
      <h1 className="t8bold w-full text-center text-gray-1000">{title}</h1>

      <p className="w-full text-center text-size-4 font-normal leading-t5 tracking-[-0.1px] text-gray-700">
        {description}
      </p>
    </section>
  );
}
