import { FieldLabel, TextField } from "@/components/common";
import PhoneVerificationSection from "./PhoneVerificationSection";

interface FindIdFormSectionProps {
  onVerificationChange?: (isVerified: boolean) => void;
}

export default function FindIdFormSection({ onVerificationChange }: FindIdFormSectionProps) {
  return (
    <section className="w-full px-x5">
      <div className="flex flex-col gap-x5">
        <div className="flex flex-col gap-x1-5">
          <FieldLabel className="text-gray-800">이름</FieldLabel>
          <TextField placeholder="이름을 입력해주세요" />
        </div>

        <PhoneVerificationSection onVerificationChange={onVerificationChange} />
      </div>
    </section>
  );
}
