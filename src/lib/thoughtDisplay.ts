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

export function appendStreamingThought(
  thoughts: Thought[],
  incoming: Thought,
): Thought[] {
  if (incoming.kind === "native") {
    const nativeIndex = thoughts.findIndex((t) => t.kind === "native");
    if (nativeIndex >= 0) {
      return thoughts.map((thought, index) =>
        index === nativeIndex
          ? {
              ...thought,
              text: joinNativeThoughtText(thought.text, incoming.text),
            }
          : thought,
      );
    }
  }

  if (
    incoming.kind === "recall" &&
    !thoughts.some((t) => t.kind === "recall")
  ) {
    const firstNativeIndex = thoughts.findIndex((t) => t.kind === "native");
    if (firstNativeIndex >= 0) {
      return [
        ...thoughts.slice(0, firstNativeIndex),
        incoming,
        ...thoughts.slice(firstNativeIndex),
      ];
    }
  }

  return [...thoughts, incoming];
}

export function normalizeThoughtOrder(thoughts: Thought[]): Thought[] {
  return thoughts.reduce<Thought[]>(
    (out, thought) => appendStreamingThought(out, thought),
    [],
  );
}

/** Fold every `native` fragment into one readable thought row. */
export function mergeNativeThoughts(thoughts: Thought[]): Thought[] {
  const out: Thought[] = [];
  let nativeIndex = -1;

  for (const t of thoughts) {
    const text = thoughtDisplayText(t);

    if (t.kind === "native" && nativeIndex >= 0) {
      out[nativeIndex] = {
        ...out[nativeIndex],
        text: joinNativeThoughtText(out[nativeIndex].text, text),
      };
    } else {
      if (t.kind === "native") nativeIndex = out.length;
      out.push({ ...t, text });
    }
  }

  return out.filter((row) => row.text.trim().length > 0);
}
