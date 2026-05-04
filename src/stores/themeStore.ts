import { useEffect } from "react";
import { create } from "zustand";

export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "zuoran-theme";

function readStoredPreference(): ThemePreference {
  if (typeof window === "undefined") return "system";
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    if (v === "light" || v === "dark" || v === "system") return v;
  } catch {
    // ignore
  }
  return "system";
}

function systemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function resolveTheme(pref: ThemePreference): ResolvedTheme {
  return pref === "system" ? systemTheme() : pref;
}

function applyTheme(resolved: ResolvedTheme): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (resolved === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
  // Update mobile chrome theme color too
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", resolved === "dark" ? "#09090b" : "#fafaf9");
  }
}

interface ThemeState {
  preference: ThemePreference;
  resolved: ResolvedTheme;
  setPreference: (pref: ThemePreference) => void;
  toggle: () => void;
  /** Internal: re-evaluate when system color scheme changes. */
  _syncFromSystem: () => void;
}

const initialPref = readStoredPreference();
const initialResolved = resolveTheme(initialPref);
applyTheme(initialResolved);

export const useThemeStore = create<ThemeState>((set, get) => ({
  preference: initialPref,
  resolved: initialResolved,

  setPreference(pref) {
    try {
      window.localStorage.setItem(STORAGE_KEY, pref);
    } catch {
      // ignore quota / private mode
    }
    const resolved = resolveTheme(pref);
    applyTheme(resolved);
    set({ preference: pref, resolved });
  },

  toggle() {
    const next = get().resolved === "dark" ? "light" : "dark";
    get().setPreference(next);
  },

  _syncFromSystem() {
    if (get().preference !== "system") return;
    const resolved = systemTheme();
    if (resolved !== get().resolved) {
      applyTheme(resolved);
      set({ resolved });
    }
  },
}));

/**
 * Mount once near the top of the app so that:
 *  - changes to the OS color scheme propagate when preference === "system"
 *  - changes from another tab (different localStorage write) sync here too
 */
export function useThemeSync(): void {
  const sync = useThemeStore((s) => s._syncFromSystem);
  const setPref = useThemeStore((s) => s.setPreference);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => sync();
    mq.addEventListener("change", onChange);

    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY || !e.newValue) return;
      if (e.newValue === "light" || e.newValue === "dark" || e.newValue === "system") {
        setPref(e.newValue);
      }
    };
    window.addEventListener("storage", onStorage);

    return () => {
      mq.removeEventListener("change", onChange);
      window.removeEventListener("storage", onStorage);
    };
  }, [sync, setPref]);
}
