import { useCallback, useState } from "react";
import {
  applyDarkMode,
  type AppSettings,
  patchAppSettings,
  readAppSettings,
} from "@/lib/settings/appSettings";

export function useAppSettings() {
  const [settings, setSettings] = useState<AppSettings>(() => readAppSettings());

  const updateSetting = useCallback(
    <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
      const next = patchAppSettings({ [key]: value });
      setSettings(next);
      if (key === "darkMode") {
        applyDarkMode(Boolean(value));
      }
    },
    [],
  );

  return { settings, updateSetting };
}
