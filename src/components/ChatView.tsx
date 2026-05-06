import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";
import StreamingAssistantBubble from "./StreamingAssistantBubble";
import { useSession } from "../hooks/useSessions";
import { useStreamMessage } from "../hooks/useStreamMessage";
import {
  characterLabel,
  MODE_LABELS,
  scopeLabel,
} from "../lib/labels";

interface Props {
  sessionId: string;
}

export default function ChatView({ sessionId }: Props) {
  const session = useSession(sessionId);
  const stream = useStreamMessage();

  const scrollerRef = useRef<HTMLDivElement>(null);
  const messagesLength = session.data?.messages.length ?? 0;

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [
    messagesLength,
    stream.isPending,
    stream.streamState.partialContent,
    stream.streamState.thoughts.length,
  ]);

  if (session.isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-text-soft">
        <Loader2 className="animate-spin" size={20} />
      </div>
    );
  }

  if (session.error) {
    return (
      <div className="flex h-full items-center justify-center px-6">
        <div className="max-w-md rounded-xl border-2 border-border-soft bg-danger-pale px-4 py-3 text-sm text-danger-soft">
          Failed to load this conversation: {session.error.message}
        </div>
      </div>
    );
  }

  if (!session.data) return null;

  const characterName = characterLabel(session.data.character_id);
  const isPending = stream.isPending;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="section-card mx-3 mt-3 overflow-hidden sm:mx-6 sm:mt-4">
        <div className="section-card__header px-4 sm:px-6">
          <div className="min-w-0">
            <h1 className="truncate text-lg font-extrabold tracking-tight text-primary-light">
              {characterName}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-primary-light/90">
              <span className="rounded-full border border-border-soft bg-primary-pale px-2 py-0.5 font-semibold text-primary-strong">
                {MODE_LABELS[session.data.mode]}
              </span>
              <span className="rounded-full border border-border-soft bg-primary-pale px-2 py-0.5 font-semibold text-primary-strong">
                {scopeLabel(session.data.continuity_scope)}
              </span>
              {session.data.pinned_time && (
                <span className="rounded-full border border-border-soft bg-primary-pale px-2 py-0.5 font-semibold text-primary-strong">
                  时:{session.data.pinned_time}
                </span>
              )}
              {session.data.pinned_location && (
                <span className="rounded-full border border-border-soft bg-primary-pale px-2 py-0.5 font-semibold text-primary-strong">
                  地:{session.data.pinned_location}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      <div
        ref={scrollerRef}
        className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-3 py-6 sm:px-6"
      >
        <div className="mx-auto flex max-w-3xl flex-col gap-5">
          {session.data.messages.length === 0 && !isPending && (
            <div className="panel rounded-bubble border-2 border-dashed border-border-soft px-4 py-6 text-center text-sm text-text-muted">
              Start the scene. Try a setting cue (“在公寓门口偶遇”) or just
              say hi.
            </div>
          )}

          {session.data.messages.map((m) => (
            <MessageBubble
              key={m.id}
              message={m}
              characterName={characterName}
              pending={m.id.startsWith("temp-")}
            />
          ))}

          {isPending && (
            <StreamingAssistantBubble
              characterName={characterName}
              thoughts={stream.streamState.thoughts}
              partialContent={stream.streamState.partialContent}
              status={stream.streamState.status}
            />
          )}

          {stream.streamState.error && !isPending && (
            <div className="self-center rounded-xl border-2 border-border-soft bg-danger-pale px-3 py-2 text-xs text-danger-soft">
              {stream.streamState.error.message} — your last message wasn&apos;t
              sent.
            </div>
          )}
        </div>
      </div>

      <MessageInput
        pending={isPending}
        onSend={(content) =>
          void stream.sendMessage({ sessionId, content })
        }
      />
    </div>
  );
}
