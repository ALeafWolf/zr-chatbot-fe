import type { Thought } from "../api/client";
import type { StreamStatus } from "../hooks/useStreamMessage";
import { THOUGHT_KIND_LABELS } from "../lib/labels";

interface Props {
  characterName: string;
  thoughts: Thought[];
  partialContent: string;
  status: StreamStatus;
}

export default function StreamingAssistantBubble({
  characterName,
  thoughts,
  partialContent,
  status,
}: Props) {
  const hasReply = partialContent.trim().length > 0;
  const visibleThoughts = thoughts.filter((t) => t.text.trim().length > 0);
  const showDots =
    !hasReply &&
    (status === "thinking" ||
      (status === "streaming" && partialContent.trim().length === 0));

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={`${characterName} is responding`}
      className="flex w-full animate-fade-in justify-start"
    >
      <div className="flex max-w-[85%] flex-col gap-2 sm:max-w-[75%]">
        <span className="px-1 text-[11px] font-medium text-fg-subtle">
          {characterName}
        </span>

        {(visibleThoughts.length > 0 || showDots) && (
          <div className="border-l-2 border-border pl-3">
            <div className="space-y-2">
              {visibleThoughts.map((t, idx) => (
                <div key={`${t.ts}-${idx}`} className="text-[13px] leading-snug">
                  <span className="mr-2 rounded-full bg-surface-muted px-2 py-0.5 text-[10px] font-medium text-fg-muted">
                    {THOUGHT_KIND_LABELS[t.kind] ?? t.kind}
                  </span>
                  <span className="text-fg-muted">{t.text}</span>
                </div>
              ))}
              {visibleThoughts.length === 0 && showDots && (
                <div className="flex items-start gap-2 text-[13px] text-fg-muted">
                  <span className="mt-1.5 inline-flex shrink-0 gap-1">
                    <span className="typing-dot inline-block h-1.5 w-1.5 rounded-full bg-fg-muted" />
                    <span
                      className="typing-dot inline-block h-1.5 w-1.5 rounded-full bg-fg-muted"
                      style={{ animationDelay: "120ms" }}
                    />
                    <span
                      className="typing-dot inline-block h-1.5 w-1.5 rounded-full bg-fg-muted"
                      style={{ animationDelay: "240ms" }}
                    />
                  </span>
                  <span>思考中…</span>
                </div>
              )}
              {visibleThoughts.length > 0 && showDots && (
                <div className="flex items-center gap-2 pt-0.5 text-fg-muted">
                  <span className="inline-flex shrink-0 gap-1">
                    <span className="typing-dot inline-block h-1.5 w-1.5 rounded-full bg-fg-muted" />
                    <span
                      className="typing-dot inline-block h-1.5 w-1.5 rounded-full bg-fg-muted"
                      style={{ animationDelay: "120ms" }}
                    />
                    <span
                      className="typing-dot inline-block h-1.5 w-1.5 rounded-full bg-fg-muted"
                      style={{ animationDelay: "240ms" }}
                    />
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {hasReply && (
          <div className="rounded-2xl rounded-bl-md bg-bubble-assistant-bg px-4 py-2.5 text-[15px] leading-relaxed text-bubble-assistant-fg shadow-sm">
            <div className="whitespace-pre-wrap wrap-break-word">{partialContent}</div>
          </div>
        )}
      </div>
    </div>
  );
}
