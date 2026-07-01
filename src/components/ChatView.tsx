import {
  useCallback,
  useLayoutEffect,
  useRef,
  useEffect,
  useState,
} from "react";
import { Loader2, BarChart3 } from "lucide-react";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";
import StreamingAssistantBubble from "./StreamingAssistantBubble";
import AppCommandMessage from "./AppCommandMessage";
import type { AppCommandResult } from "../api/appCommandTypes";
import EditableSessionTitle from "./EditableSessionTitle";
import AxisStateDrawer from "./AxisStateDrawer";
import {
  useSessionDetailInfinite,
  sessionDetailFromPages,
  usePatchSession,
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
  const patchSession = usePatchSession();
  const [axisDrawerOpen, setAxisDrawerOpen] = useState(false);

  // O1: cancel in-flight poll on session switch (ChatView isn't re-keyed)
  useEffect(() => {
    return () => {
      stream.cancelPendingPoll();
    };
  }, [sessionId, stream.cancelPendingPoll]);

  const session = sessionDetailFromPages(sessionQuery.data?.pages ?? []);
  const messagesLength = session?.messages.length ?? 0;
  const oldestMessageId = session?.messages[0]?.id;
  const latestMessage = session?.messages[messagesLength - 1];
  const latestMessageId = latestMessage?.id;
  const latestMessageRole = latestMessage?.role;

  const scrollerRef = useRef<HTMLDivElement>(null);
  const restoreScrollRef = useRef<{ sh: number; st: number } | null>(null);
  const scrollRafRef = useRef<number | null>(null);
  const initialScrollForSession = useRef<string | null>(null);
  const latestScrolledMessageRef = useRef<string | null>(null);
  const [tempDraft, setTempDraft] = useState(1);
  const tempPatchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  useEffect(
    () => () => {
      if (tempPatchTimerRef.current != null) {
        clearTimeout(tempPatchTimerRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    if (!session) return;
    setTempDraft(session.temperature);
  }, [session?.session_id, session?.temperature]);

  const scheduleTemperaturePatch = useCallback(
    (value: number) => {
      if (tempPatchTimerRef.current != null) {
        clearTimeout(tempPatchTimerRef.current);
      }
      tempPatchTimerRef.current = setTimeout(() => {
        tempPatchTimerRef.current = null;
        patchSession.mutate({
          sessionId,
          temperature: value,
        });
      }, 350);
    },
    [patchSession, sessionId],
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
    stream.streamState.status,
  ]);

  useLayoutEffect(() => {
    if (!latestMessageId) return;
    const scrollKey = `${sessionId}:${latestMessageId}`;
    if (latestScrolledMessageRef.current === scrollKey) return;
    latestScrolledMessageRef.current = scrollKey;
    if (latestMessageRole !== "assistant") return;
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "auto" });
  }, [sessionId, latestMessageId, latestMessageRole]);

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
  const settingsDisabled = isPending || patchSession.isPending;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="section-card mx-3 mt-3 overflow-hidden sm:mx-6 sm:mt-4">
        <div className="section-card__header flex flex-wrap items-center justify-between gap-4 px-4 sm:px-6">
          <div className="min-w-0 flex-1">
            <EditableSessionTitle
              sessionId={session.session_id}
              characterId={session.character_id}
              displayTitle={session.display_title}
              variant="header"
              className="truncate text-lg font-extrabold tracking-tight text-primary-light"
            />
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
          <div className="flex shrink-0 flex-col items-end gap-3 sm:flex-row sm:items-center sm:gap-4 text-xs text-primary-light/90">
            <div className="flex items-center gap-2">
              <input
                id={`thinking-${session.session_id}`}
                type="checkbox"
                className="h-3.5 w-3.5 shrink-0 rounded border-border-soft text-primary-strong focus-visible:ring-2 focus-visible:ring-primary-light/40 focus-visible:outline-none disabled:opacity-50"
                checked={session.thinking}
                disabled={settingsDisabled}
                onChange={() =>
                  patchSession.mutate({
                    sessionId: session.session_id,
                    thinking: !session.thinking,
                  })
                }
              />
              <label
                htmlFor={`thinking-${session.session_id}`}
                className={`whitespace-nowrap font-medium ${settingsDisabled ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
              >
                Generation reasoning (thinking)
              </label>
            </div>
            <div className="flex items-center gap-2">
              <span className="whitespace-nowrap font-medium text-primary-light/90">
                Temperature
              </span>
              <input
                type="range"
                min={0}
                max={2}
                step={0.1}
                className="h-2 w-28 accent-primary-strong sm:w-32 disabled:opacity-50"
                value={tempDraft}
                disabled={settingsDisabled}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setTempDraft(v);
                  scheduleTemperaturePatch(v);
                }}
              />
              <span className="w-10 tabular-nums text-right font-semibold text-primary-strong">
                {tempDraft.toFixed(1)}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setAxisDrawerOpen((v) => !v)}
              className={`icon-button ${axisDrawerOpen ? "border-primary-pink bg-surface-2" : "icon-button--dark"} -mr-1`}
              aria-label={axisDrawerOpen ? "Close axis drawer" : "Open axis drawer"}
              title="Emotional Axis"
            >
              <BarChart3 size={18} />
            </button>
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

          {session.messages.map((m) =>
            m.route === "app_command" && m.app_command ? (
              <AppCommandMessage key={m.id} message={m} />
            ) : (
              <MessageBubble
                key={m.id}
                message={m}
                characterName={characterName}
                pending={m.id.startsWith("temp-")}
              />
            ),
          )}

          {/* Temp app-command card shown between stream done and refetch —
              scoped to the active sessionId so switching sessions doesn't
              render the previous session's temporary card. */}
          {stream.streamState.lastDone?.route === "app_command" &&
            stream.streamState.lastDone.app_command != null &&
            stream.streamState.lastSessionId === sessionId &&
            !session.messages.some(
              (m) => m.id === stream.streamState.lastDone!.message_id,
            ) && (
              <AppCommandMessage
                message={{
                  id: stream.streamState.lastDone.message_id,
                  content: stream.streamState.lastDone.content,
                  app_command: stream.streamState.lastDone.app_command as
                    | AppCommandResult
                    | undefined,
                }}
              />
            )}

          {/* Streaming bubble — suppressed for app commands even during
              stream processing (the backend emits a `route` SSE event after
              classification, so the frontend knows to avoid the character
              streaming bubble for utility commands). */}
          {isPending &&
            stream.streamState.streamRoute !== "app_command" && (
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

      <AxisStateDrawer
        sessionId={sessionId}
        open={axisDrawerOpen}
        onClose={() => setAxisDrawerOpen(false)}
      />
    </div>
  );
}
