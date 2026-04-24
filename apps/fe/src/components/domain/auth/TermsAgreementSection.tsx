import { useEffect, useState } from "react";
import { CheckboxRow } from "@/components/common";

interface TermsAgreementSectionProps {
  onAllCheckedChange?: (checked: boolean) => void;
}

export default function TermsAgreementSection({ onAllCheckedChange }: TermsAgreementSectionProps) {
  const [agreements, setAgreements] = useState({
    terms: false,
    privacy: false,
  });

  const allChecked = agreements.terms && agreements.privacy;

  useEffect(() => {
    onAllCheckedChange?.(allChecked);
  }, [allChecked, onAllCheckedChange]);

  return (
    <section className="flex flex-col gap-x4 py-x2">
      <CheckboxRow
        label="전체 동의"
        checked={allChecked}
        labelClassName={allChecked ? "text-gray-800" : undefined}
        onCheckedChange={(checked) => {
          setAgreements({ terms: checked, privacy: checked });
        }}
      />
      <CheckboxRow
        label="[필수] 빵빵 이용약관 동의"
        hasArrow
        checked={agreements.terms}
        onCheckedChange={(checked) => {
          setAgreements((prev) => ({ ...prev, terms: checked }));
        }}
      />
      <CheckboxRow
        label="[필수] 빵빵 개인정보 수집 및 이용 동의"
        hasArrow
        checked={agreements.privacy}
        onCheckedChange={(checked) => {
          setAgreements((prev) => ({ ...prev, privacy: checked }));
        }}
      />
    </section>
  );
}
