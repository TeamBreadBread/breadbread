import { FieldLabel, TextField } from "@/components/common";
import PhoneVerificationSection from "./PhoneVerificationSection";

interface FindIdFormSectionProps {
  name: string;
  onNameChange: (value: string) => void;
  onVerificationChange?: (isVerified: boolean) => void;
  onVerificationTokenChange?: (token: string | null) => void;
  onPhoneDigitsChange?: (digits: string) => void;
}

export default function FindIdFormSection({
  name,
  onNameChange,
  onVerificationChange,
  onVerificationTokenChange,
  onPhoneDigitsChange,
}: FindIdFormSectionProps) {
  return (
    <section className="w-full px-x5">
      <div className="flex flex-col gap-x5">
        <div className="flex flex-col gap-x1-5">
          <FieldLabel className="text-gray-800">이름</FieldLabel>
          <TextField placeholder="이름을 입력해주세요" value={name} onChange={onNameChange} />
        </div>

        <PhoneVerificationSection
          purpose="FIND_ID"
          onVerificationChange={onVerificationChange}
          onVerificationTokenChange={onVerificationTokenChange}
          onPhoneDigitsChange={onPhoneDigitsChange}
        />
      </div>
    </section>
  );
}
