import AccountInfoItem from "./AccountInfoItem";
import type { AccountInfo } from "./types";

interface AccountInfoSectionProps {
  items: AccountInfo[];
}

export default function AccountInfoSection({ items }: AccountInfoSectionProps) {
  return (
    <section className="w-full bg-white">
      {items.map((item) => (
        <AccountInfoItem key={item.id} label={item.label} value={item.value} />
      ))}
    </section>
  );
}
