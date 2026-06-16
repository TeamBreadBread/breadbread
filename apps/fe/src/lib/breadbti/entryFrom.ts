export const BREAD_BTI_ENTRY_FROM_KEY = "breadbti:entry-from";

export type BreadBtiEntryFrom = "bbangteo" | "ai-generating";

export function markBreadBtiEntryFrom(source: BreadBtiEntryFrom): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(BREAD_BTI_ENTRY_FROM_KEY, source);
}

export function isBreadBtiFromBbangteo(): boolean {
  if (typeof sessionStorage === "undefined") return false;
  return sessionStorage.getItem(BREAD_BTI_ENTRY_FROM_KEY) === "bbangteo";
}

export function isBreadBtiFromAiGenerating(): boolean {
  if (typeof sessionStorage === "undefined") return false;
  return sessionStorage.getItem(BREAD_BTI_ENTRY_FROM_KEY) === "ai-generating";
}

export function clearBreadBtiEntryFrom(): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.removeItem(BREAD_BTI_ENTRY_FROM_KEY);
}

export function parseBreadBtiEntryFrom(value: unknown): BreadBtiEntryFrom | undefined {
  if (value === "bbangteo") return "bbangteo";
  if (value === "ai-generating") return "ai-generating";
  return undefined;
}

export function breadBtiFlowSearch(from?: BreadBtiEntryFrom) {
  return from ? { from } : {};
}
