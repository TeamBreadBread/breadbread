export type BakeryListEntryFrom = "home" | "bbangteo" | "ai-result";

export function parseBakeryListEntryFrom(value: unknown): BakeryListEntryFrom | undefined {
  if (value === "home" || value === "bbangteo" || value === "ai-result") {
    return value;
  }
  return undefined;
}
