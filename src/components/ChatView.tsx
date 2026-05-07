import {
  useCallback,
  useLayoutEffect,
  useRef,
  useEffect,
} from "react";
import { Loader2 } from "lucide-react";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";
import StreamingAssistantBubble from "./StreamingAssistantBubble";
import {
  useSessionDetailInfinite,
  sessionDetailFromPages,
} from "../hooks/useSessions";
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
  const sessionQuery = useSessionDetailInfinite(sessionId);
  const stream = useStreamMessage();

  const session = sessionDetailFromPages(sessionQuery.data?.pages ?? []);
  const messagesLength = session?.messages.length ?? 0;
  const oldestMessageId = session?.messages[0]?.id;

  const scrollerRef = useRef<HTMLDivElement>(null);
  const restoreScrollRef = useRef<{ sh: number; st: number } | null>(null);
  const scrollRafRef = useRef<number | null>(null);
  const initialScrollForSession = useRef<string | null>(null);

  const tryFetchOlder = useCallback(() => {
    const el = scrollerRef.current;
    if (!el || restoreScrollRef.current) return;
    if (el.scrollTop > 200) return;
    if (!sessionQuery.hasNextPage || sessionQuery.isFetchingNextPage) return;
    restoreScrollRef.current = { sh: el.scrollHeight, st: el.scrollTop };
    void sessionQuery.fetchNextPage().catch(() => {
      restoreScrollRef.current = null;
    });
  }, [
    sessionQuery.hasNextPage,
    sessionQuery.isFetchingNextPage,
    sessionQuery.fetchNextPage,
  ]);

  const onScroll = useCallback(() => {
    if (scrollRafRef.current != null) return;
    scrollRafRef.current = requestAnimationFrame(() => {
      scrollRafRef.current = null;
      tryFetchOlder();
    });
  }, [tryFetchOlder]);

  useEffect(
    () => () => {
      if (scrollRafRef.current != null) {
        cancelAnimationFrame(scrollRafRef.current);
      }
    },
    [],
  );

  useLayoutEffect(() => {
    const r = restoreScrollRef.current;
    const el = scrollerRef.current;
    if (!r || !el) return;
    const delta = el.scrollHeight - r.sh;
    el.scrollTop = r.st + delta;
    restoreScrollRef.current = null;
  }, [oldestMessageId, messagesLength]);

  useLayoutEffect(() => {
    if (initialScrollForSession.current !== sessionId) {
      initialScrollForSession.current = null;
    }
  }, [sessionId]);

  useLayoutEffect(() => {
    if (!sessionId || messagesLength === 0) return;
    if (initialScrollForSession.current === sessionId) return;
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "auto" });
    initialScrollForSession.current = sessionId;
  }, [sessionId, messagesLength]);

  useLayoutEffect(() => {
    if (!stream.isPending) return;
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "auto" });
  }, [
    stream.isPending,
    stream.streamState.partialContent,
    stream.streamState.thoughts.length,
  ]);

  if (sessionQuery.isPending && !sessionQuery.data) {
    return (
      <div className="flex h-full items-center justify-center text-text-soft">
        <Loader2 className="animate-spin" size={20} />
      </div>
    );
  }

  if (sessionQuery.error) {
    return (
      <div className="flex h-full items-center justify-center px-6">
        <div className="max-w-md rounded-xl border-2 border-border-soft bg-danger-pale px-4 py-3 text-sm text-danger-soft">
          Failed to load this conversation: {sessionQuery.error.message}
        </div>
      </div>
    );
  }

  if (!session) return null;

  const characterName = characterLabel(session.character_id);
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
                {MODE_LABELS[session.mode]}
              </span>
              <span className="rounded-full border border-border-soft bg-primary-pale px-2 py-0.5 font-semibold text-primary-strong">
                {scopeLabel(session.continuity_scope)}
              </span>
              {session.pinned_time && (
                <span className="rounded-full border border-border-soft bg-primary-pale px-2 py-0.5 font-semibold text-primary-strong">
                  时:{session.pinned_time}
                </span>
              )}
              {session.pinned_location && (
                <span className="rounded-full border border-border-soft bg-primary-pale px-2 py-0.5 font-semibold text-primary-strong">
                  地:{session.pinned_location}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      <div
        ref={scrollerRef}
        onScroll={onScroll}
        className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-3 py-6 sm:px-6"
      >
        <div className="mx-auto flex max-w-3xl flex-col gap-5">
          {sessionQuery.isFetchingNextPage && (
            <div className="flex justify-center py-2 text-xs text-text-muted">
              <Loader2 className="mr-2 animate-spin" size={14} />
              加载更早的消息…
            </div>
          )}

          {session.messages.length === 0 && !isPending && (
            <div className="panel rounded-bubble border-2 border-dashed border-border-soft px-4 py-6 text-center text-sm text-text-muted">
              Start the scene. Try a setting cue (“在公寓门口偶遇”) or just
              say hi.
            </div>
          )}

          {session.messages.map((m) => (
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
