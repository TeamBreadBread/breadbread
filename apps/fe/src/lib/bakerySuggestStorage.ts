export type BakerySuggestType = "NEW" | "UPDATE";

export type BakeryCorrectionField = "ADDRESS" | "DONG" | "MENU" | "HOURS" | "OTHER";

export type BakerySuggestion = {
  id: string;
  type: BakerySuggestType;
  bakeryName: string;
  address: string;
  dong: string;
  signatureMenu: string;
  message: string;
  targetBakeryId?: number;
  correctionTarget?: BakeryCorrectionField;
  correctedInfo?: string;
  createdAt: string;
};

const STORAGE_KEY = "bbangbread:bakery-suggestions";
const MAX_ITEMS = 100;

export function loadBakerySuggestions(): BakerySuggestion[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isBakerySuggestion);
  } catch {
    return [];
  }
}

export function saveBakerySuggestion(
  entry: Omit<BakerySuggestion, "id" | "createdAt">,
): BakerySuggestion {
  const item: BakerySuggestion = {
    ...entry,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  const next = [item, ...loadBakerySuggestions()].slice(0, MAX_ITEMS);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return item;
}

function isBakerySuggestion(value: unknown): value is BakerySuggestion {
  if (!value || typeof value !== "object") return false;
  const row = value as Partial<BakerySuggestion>;
  return (
    typeof row.id === "string" &&
    (row.type === "NEW" || row.type === "UPDATE") &&
    typeof row.bakeryName === "string" &&
    typeof row.createdAt === "string"
  );
}
