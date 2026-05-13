import type { Thought } from "../api/client";

/** Visible fallback for non-native thought stages when the backend summary is blank. */
export function thoughtDisplayText(thought: Thought): string {
  const text = thought.text.trim();
  if (text.length > 0) return thought.text;

  switch (thought.kind) {
    case "recall":
      return "我得先理清这些。";
    case "tool_decision":
      return "我需要查一下。";
    case "tool_result":
      return "我知道该怎么接下去了。";
    case "rewrite":
      return "我得换个更稳妥的说法。";
    case "deflect":
      return "这个方向不能再往下说。";
    default:
      return "";
  }
}

/** Join streamed reasoning fragments without inserting spaces between CJK runs. */
export function joinNativeThoughtText(prev: string, next: string): string {
  if (!prev) return next;
  if (!next) return prev;
  const prevLast = prev[prev.length - 1];
  const nextFirst = next[0];
  const isAsciiLetter = (c: string) => /[a-zA-Z]/.test(c);
  const isSpace = (c: string) => /\s/.test(c);
  if (isSpace(prevLast ?? "") || isSpace(nextFirst ?? "")) return prev + next;
  if (
    prevLast &&
    nextFirst &&
    isAsciiLetter(prevLast) &&
    isAsciiLetter(nextFirst)
  ) {
    return `${prev} ${next}`;
  }
  return prev + next;
}

/** Fold consecutive `native` thoughts for readable popup / history display. */
export function mergeAdjacentNativeThoughts(thoughts: Thought[]): Thought[] {
  const out: Thought[] = [];
  for (const t of thoughts) {
    const text = thoughtDisplayText(t);
    const last = out[out.length - 1];
    if (t.kind === "native" && last?.kind === "native") {
      last.text = joinNativeThoughtText(last.text, text);
    } else {
      out.push({ ...t, text });
    }
  }
  return out.filter((row) => row.text.trim().length > 0);
}
