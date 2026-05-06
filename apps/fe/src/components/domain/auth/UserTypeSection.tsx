import type { UserRole } from "@/api/auth";
import { FieldLabel, RadioRow } from "@/components/common";

const OPTIONS: { label: string; role: UserRole }[] = [
  { label: "빵빵 이용자", role: "ROLE_USER" },
  { label: "빵집 사장님", role: "ROLE_BUSINESS" },
  { label: "택시 기사님", role: "ROLE_DRIVER" },
];

type UserTypeSectionProps = {
  value: UserRole;
  onChange: (role: UserRole) => void;
};

export default function UserTypeSection({ value, onChange }: UserTypeSectionProps) {
  return (
    <section className="flex flex-col gap-x1_5">
      <FieldLabel>이용자 선택</FieldLabel>

      <div className="flex flex-col gap-x4 py-x2">
        {OPTIONS.map(({ label, role }) => (
          <RadioRow
            key={role}
            label={label}
            checked={value === role}
            onCheckedChange={() => onChange(role)}
          />
        ))}
      </div>
    </section>
  );
}
