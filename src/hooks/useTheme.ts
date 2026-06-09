import { useCallback, useEffect, useState } from "react";
import { DEFAULT_THEME } from "../lib/themes";

const KEY = "wc2026-theme";

/** Applies the theme to <html data-theme> and persists the choice. */
export function useTheme(): [string, (id: string) => void] {
  const [theme, setThemeState] = useState<string>(
    () => localStorage.getItem(KEY) || DEFAULT_THEME,
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const setTheme = useCallback((id: string) => {
    setThemeState(id);
    localStorage.setItem(KEY, id);
  }, []);

  return [theme, setTheme];
}
