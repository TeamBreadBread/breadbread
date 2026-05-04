export type BakeryListEntryFrom = "home" | "bbangteo";

export function parseBakeryListEntryFrom(value: unknown): BakeryListEntryFrom | undefined {
  if (value === "home" || value === "bbangteo") {
    return value;
  }
  return undefined;
}
