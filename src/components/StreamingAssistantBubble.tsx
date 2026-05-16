import type { Thought } from "../api/client";
import type { StreamStatus } from "../hooks/useStreamMessage";
import { THOUGHT_KIND_LABELS } from "../lib/labels";
import { mergeNativeThoughts } from "../lib/thoughtDisplay";

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
  const visibleThoughts = mergeNativeThoughts(thoughts);
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
      <div className="flex max-w-full flex-col gap-2">
        <span className="px-1 text-xs font-semibold text-text-soft">
          {characterName}
        </span>

        {(visibleThoughts.length > 0 || showDots) && (
          <div className="border-l-2 border-border-soft pl-3">
            <div className="space-y-2">
              {visibleThoughts.map((t, idx) => (
                <div key={`${t.ts}-${idx}`} className="text-13 leading-snug">
                  <span className="mr-2 rounded-full bg-header-dark px-2 py-0.5 text-2xs font-extrabold text-primary-light">
                    {THOUGHT_KIND_LABELS[t.kind] ?? t.kind}
                  </span>
                  <span className="text-text-muted">{t.text}</span>
                </div>
              ))}
              {visibleThoughts.length === 0 && showDots && (
                <div className="flex items-start gap-2 text-13 text-text-muted">
                  <span className="mt-1.5 inline-flex shrink-0 gap-1">
                    <span className="typing-dot inline-block size-1.5 rounded-full bg-primary-strong" />
                    <span
                      className="typing-dot inline-block size-1.5 rounded-full bg-primary-strong"
                      style={{ animationDelay: "120ms" }}
                    />
                    <span
                      className="typing-dot inline-block size-1.5 rounded-full bg-primary-strong"
                      style={{ animationDelay: "240ms" }}
                    />
                  </span>
                  <span>思考中…</span>
                </div>
              )}
              {visibleThoughts.length > 0 && showDots && (
                <div className="flex items-center gap-2 pt-0.5 text-text-muted">
                  <span className="inline-flex shrink-0 gap-1">
                    <span className="typing-dot inline-block size-1.5 rounded-full bg-primary-strong" />
                    <span
                      className="typing-dot inline-block size-1.5 rounded-full bg-primary-strong"
                      style={{ animationDelay: "120ms" }}
                    />
                    <span
                      className="typing-dot inline-block size-1.5 rounded-full bg-primary-strong"
                      style={{ animationDelay: "240ms" }}
                    />
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {hasReply && (
          <div className="message-bubble text-15 leading-relaxed text-text-main shadow-soft-pink">
            <div className="whitespace-pre-wrap wrap-break-word">
              {partialContent}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
