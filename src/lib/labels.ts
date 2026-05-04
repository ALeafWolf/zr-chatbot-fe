import type { ChatMode } from "../api/client";

export const MODE_LABELS: Record<ChatMode, string> = {
  canonical_live: "Canonical · live",
  pinned_scenario: "Pinned scenario",
  sandbox: "Sandbox",
};

export const MODE_DESCRIPTIONS: Record<ChatMode, string> = {
  canonical_live:
    "Continues from the latest canon point. Memory writes back to the world.",
  pinned_scenario:
    "Replay a fixed time/place from canon. Memory writes are optional.",
  sandbox: "Free exploration. No memory writeback to the canonical world.",
};

const SCOPE_LABELS: Record<string, string> = {
  main_pre_relationship: "Main · pre-relationship (未名篇)",
  main_situationship: "Main · situationship (未名 + 旖慕)",
  main_sweet: "Main · sweet (+ 甜蜜篇)",
  main_engaged: "Main · engaged (+ 相守篇)",
  main_married: "Main · married (+ 挚爱篇)",
};

export function scopeLabel(scope: string): string {
  return SCOPE_LABELS[scope] ?? scope;
}

const CHARACTER_LABELS: Record<string, string> = {
  zou_ran: "左然 (Zou Ran)",
};

export function characterLabel(characterId: string, fallback?: string): string {
  return CHARACTER_LABELS[characterId] ?? fallback ?? characterId;
}

const RELATIVE_FORMATTER = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

const STEPS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ["year", 60 * 60 * 24 * 365],
  ["month", 60 * 60 * 24 * 30],
  ["week", 60 * 60 * 24 * 7],
  ["day", 60 * 60 * 24],
  ["hour", 60 * 60],
  ["minute", 60],
];

export function formatRelativeTime(date: Date): string {
  const seconds = Math.round((date.getTime() - Date.now()) / 1000);
  const abs = Math.abs(seconds);
  if (abs < 45) return "just now";
  for (const [unit, secs] of STEPS) {
    if (abs >= secs) {
      return RELATIVE_FORMATTER.format(Math.round(seconds / secs), unit);
    }
  }
  return RELATIVE_FORMATTER.format(seconds, "second");
}
