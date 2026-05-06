import type { Thought } from "../api/client";

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
    const last = out[out.length - 1];
    if (t.kind === "native" && last?.kind === "native") {
      last.text = joinNativeThoughtText(last.text, t.text);
    } else {
      out.push({ ...t });
    }
  }
  return out.filter((row) => row.text.trim().length > 0);
}
