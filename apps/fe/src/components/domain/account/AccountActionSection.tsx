import AccountActionItem from "./AccountActionItem";
import type { AccountInfo } from "./types";

interface AccountActionSectionProps {
  items: AccountInfo[];
}

export default function AccountActionSection({ items }: AccountActionSectionProps) {
  return (
    <section className="w-full bg-white">
      {items.map((item) => (
        <AccountActionItem
          key={item.id}
          label={item.label}
          danger={item.danger}
          showArrow={!item.danger}
        />
      ))}
    </section>
  );
}
