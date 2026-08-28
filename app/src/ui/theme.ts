import type { ThemeColors } from "@engine/types";

/**
 * Simulations never hardcode colours. They read resolved tokens from the live
 * stylesheet, so a sim automatically matches light mode, dark mode, and any
 * future theme without a single change to its drawing code.
 */

const SCI_KEYS = [
  "velocity", "acceleration", "force", "momentum",
  "energy-kinetic", "energy-potential", "energy-thermal", "energy-total",
  "charge-pos", "charge-neg", "field", "current",
  "cold", "hot", "mass", "distance", "time",
  "acid", "neutral", "base",
  "solid", "liquid", "gas",
  "producer", "primary-consumer", "secondary-consumer", "decomposer",
  "light", "wave",
] as const;

let cache: { key: string; value: ThemeColors } | null = null;

export function readTheme(themeKey: string): ThemeColors {
  if (cache && cache.key === themeKey) return cache.value;

  const cs = getComputedStyle(document.documentElement);
  const v = (name: string, fallback: string) => cs.getPropertyValue(name).trim() || fallback;

  const sci: Record<string, string> = {};
  for (const key of SCI_KEYS) sci[key] = v(`--sci-${key}`, "#888888");

  const value: ThemeColors = {
    surface: v("--stage", "#ffffff"),
    surfaceAlt: v("--panel-alt", "#eeeeee"),
    ink: v("--ink", "#111111"),
    inkSoft: v("--ink2", "#555555"),
    line: v("--line", "#dddddd"),
    grid: v("--grid", "#eeeeee"),
    accent: v("--accent", "#0d7c86"),
    sci,
  };
  cache = { key: themeKey, value };
  return value;
}

export function invalidateTheme(): void {
  cache = null;
}

export type ThemeMode = "light" | "dark" | "system";

const STORAGE_KEY = "gnlab.theme";

export function loadThemeMode(): ThemeMode {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark" || saved === "system") return saved;
  } catch {
    // Private browsing or blocked storage — fall through to the default.
  }
  return "system";
}

export function applyThemeMode(mode: ThemeMode): void {
  const root = document.documentElement;
  if (mode === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", mode);
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // Storage is a convenience here; the theme still applies for this session.
  }
  invalidateTheme();
}

/** Resolved light/dark, accounting for the system preference. */
export function effectiveTheme(mode: ThemeMode): "light" | "dark" {
  if (mode !== "system") return mode;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
