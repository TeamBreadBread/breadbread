export const SETTINGS_STORAGE_KEY = "breadbread_settings";

export type AppSettings = {
  tourStartNotification: boolean;
  reservationNotification: boolean;
  arrivalNotification: boolean;
  marketingNotification: boolean;
  darkMode: boolean;
  locationRecommendation: boolean;
  autoCurrentLocation: boolean;
  excludeCrowdedBakery: boolean;
  openBakeryFirst: boolean;
};

export const DEFAULT_APP_SETTINGS: AppSettings = {
  tourStartNotification: true,
  reservationNotification: true,
  arrivalNotification: true,
  marketingNotification: false,
  darkMode: false,
  locationRecommendation: true,
  autoCurrentLocation: true,
  excludeCrowdedBakery: false,
  openBakeryFirst: true,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object";
}

export function readAppSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_APP_SETTINGS };
    const parsed = JSON.parse(raw) as unknown;
    if (!isRecord(parsed)) return { ...DEFAULT_APP_SETTINGS };
    return { ...DEFAULT_APP_SETTINGS, ...parsed } as AppSettings;
  } catch {
    return { ...DEFAULT_APP_SETTINGS };
  }
}

export function writeAppSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    /* ignore */
  }
}

export function patchAppSettings(patch: Partial<AppSettings>): AppSettings {
  const next = { ...readAppSettings(), ...patch };
  writeAppSettings(next);
  return next;
}

export function applyDarkMode(enabled: boolean): void {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", enabled);
}

export function initAppSettingsTheme(): void {
  applyDarkMode(readAppSettings().darkMode);
}
