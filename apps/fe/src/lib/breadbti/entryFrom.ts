export const BREAD_BTI_ENTRY_FROM_KEY = "breadbti:entry-from";

export type BreadBtiEntryFrom = "bbangteo";

export function markBreadBtiEntryFrom(source: BreadBtiEntryFrom): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(BREAD_BTI_ENTRY_FROM_KEY, source);
}

export function isBreadBtiFromBbangteo(): boolean {
  if (typeof sessionStorage === "undefined") return false;
  return sessionStorage.getItem(BREAD_BTI_ENTRY_FROM_KEY) === "bbangteo";
}

export function clearBreadBtiEntryFrom(): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.removeItem(BREAD_BTI_ENTRY_FROM_KEY);
}

export function parseBreadBtiEntryFrom(value: unknown): BreadBtiEntryFrom | undefined {
  return value === "bbangteo" ? "bbangteo" : undefined;
}

export function breadBtiFlowSearch(from?: BreadBtiEntryFrom) {
  return from ? { from } : {};
}
