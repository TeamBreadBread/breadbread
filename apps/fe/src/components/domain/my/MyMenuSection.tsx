import type { MyMenu } from "./types";
import MyMenuItem from "./MyMenuItem";

interface MyMenuSectionProps {
  items: MyMenu[];
}

export default function MyMenuSection({ items }: MyMenuSectionProps) {
  return (
    <section className="w-full">
      {items.map((item) => (
        <MyMenuItem key={item.id} label={item.label} onClick={item.onClick} />
      ))}
    </section>
  );
}
