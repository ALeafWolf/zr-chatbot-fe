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
  main_pre_relationship: "未名篇",
  main_situationship: "+ 旖慕篇",
  main_relationship: "+ 甜蜜篇",
  main_engaged: "+ 相守篇",
  main_married: "+ 挚爱篇",
};

export function scopeLabel(scope: string): string {
  return SCOPE_LABELS[scope] ?? scope;
}

const CHARACTER_LABELS: Record<string, string> = {
  zuo_ran: "左然",
};

export function characterLabel(characterId: string, fallback?: string): string {
  return CHARACTER_LABELS[characterId] ?? fallback ?? characterId;
}

/** Stage chips for persisted/streamed thought chains — matches backend `ThoughtKind`. */
export const THOUGHT_KIND_LABELS: Record<string, string> = {
  recall: "回忆",
  tool_decision: "查找",
  tool_result: "收到",
  drafting: "起草",
  rewrite: "重整",
  deflect: "转移话题",
  native: "思考",
};

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
