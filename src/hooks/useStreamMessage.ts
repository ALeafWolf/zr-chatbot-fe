import { useCallback, useRef, useState } from "react";
import { useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { postMessagesStream } from "../api/streamClient";
import type { ChatMessage, SessionDetail, Thought } from "../api/client";
import {
  appendStreamingThought,
  normalizeThoughtOrder,
} from "../lib/thoughtDisplay";
import { AppCommandResultSchema } from "../api/appCommandTypes";
import { sessionKeys } from "./useSessions";

interface StreamArgs {
  sessionId: string;
  content: string;
}

interface OptimisticContext {
  previous: InfiniteData<SessionDetail, number> | undefined;
  tempId: string;
}

export type StreamStatus =
  | "idle"
  | "thinking"
  | "streaming"
  | "done"
  | "error";

export interface DonePayload {
  message_id: string;
  content: string;
  turn_index: number;
  was_rewritten: boolean;
  was_deflected: boolean;
  thoughts: Thought[];
  route?: string;
  app_command?: unknown;
}

export type StreamRoute = "roleplay_turn" | "app_command" | "unsupported";

export interface StreamState {
  status: StreamStatus;
  thoughts: Thought[];
  partialContent: string;
  error: Error | null;
  lastDone: DonePayload | null;
  /** Tracks whether any delta events have arrived — used to suppress the
   *  character streaming bubble for app commands (which never emit deltas). */
  hasDeltas: boolean;
  /** Route signalled by the backend via an early SSE `route` event, so the
   *  frontend can adapt its UI before the stream finishes (for example,
   *  suppressing the character streaming bubble for app commands). */
  streamRoute: StreamRoute | null;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

export function useStreamMessage() {
  const qc = useQueryClient();
  const abortRef = useRef<AbortController | null>(null);

  const [streamState, setStreamState] = useState<StreamState>({
    status: "idle",
    thoughts: [],
    partialContent: "",
    error: null,
    lastDone: null,
    hasDeltas: false,
    streamRoute: null,
  });

  const [isSending, setIsSending] = useState(false);

  const sendMessage = useCallback(
    async ({ sessionId, content }: StreamArgs): Promise<DonePayload | null> => {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;

      const key = sessionKeys.detailInfinite(sessionId);
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<InfiniteData<SessionDetail, number>>(key);

      const tempId = `temp-${Date.now()}`;
      const now = new Date();
      const lastTurn = previous?.pages[0]?.messages.at(-1)?.turn_index ?? 0;

      const optimisticUser: ChatMessage = {
        id: `${tempId}-user`,
        role: "user",
        route: "roleplay_turn",
        content,
        turn_index: lastTurn + 1,
        created_at: now,
        thoughts: [],
        app_command: undefined,
      };

      const ctx: OptimisticContext = { previous, tempId };

      if (previous?.pages[0]) {
        qc.setQueryData(key, {
          ...previous,
          pages: previous.pages.map((p, i) =>
            i === 0
              ? { ...p, updated_at: now, messages: [...p.messages, optimisticUser] }
              : p,
          ),
        });
      }

      setStreamState({
        status: "thinking",
        thoughts: [],
        partialContent: "",
        error: null,
        lastDone: null,
        hasDeltas: false,
        streamRoute: null,
      });
      setIsSending(true);

      const rollback = () => {
        if (ctx.previous) {
          qc.setQueryData(key, ctx.previous);
        } else {
          qc.removeQueries({ queryKey: key });
        }
      };

      let donePayload: DonePayload | undefined;

      try {
        await postMessagesStream(sessionId, content, {
          signal: ac.signal,
          onEvent: (event, data) => {
            if (event === "route" && isRecord(data)) {
              const route = data.route;
              if (
                route === "roleplay_turn" ||
                route === "app_command" ||
                route === "unsupported"
              ) {
                setStreamState((s) => ({ ...s, streamRoute: route }));
              }
            }
            if (event === "thought" && isRecord(data)) {
              const kind = typeof data.kind === "string" ? data.kind : "native";
              const text = typeof data.text === "string" ? data.text : "";
              const ts = typeof data.ts === "number" ? data.ts : Date.now();
              const incoming: Thought = {
                kind,
                text,
                ts,
                meta: data.meta,
              };
              setStreamState((s) => {
                return {
                  ...s,
                  status: "thinking",
                  thoughts: appendStreamingThought(s.thoughts, incoming),
                };
              });
            }
            if (event === "delta" && isRecord(data)) {
              const piece = typeof data.text === "string" ? data.text : "";
              if (!piece) return;
              setStreamState((s) => ({
                ...s,
                status: "streaming",
                partialContent: s.partialContent + piece,
                hasDeltas: true,
              }));
            }
            if (event === "done" && isRecord(data)) {
              // Validate streaming app_command payload so downstream components
              // receive a typed result or undefined, never a malformed object.
              const rawAppCmd = data.app_command;
              let validatedAppCmd: unknown = undefined;
              if (rawAppCmd != null) {
                const parsed = AppCommandResultSchema.safeParse(rawAppCmd);
                if (parsed.success) validatedAppCmd = parsed.data;
              }

              donePayload = {
                message_id: String(data.message_id ?? ""),
                content: String(data.content ?? ""),
                turn_index: Number(data.turn_index ?? 0),
                was_rewritten: Boolean(data.was_rewritten),
                was_deflected: Boolean(data.was_deflected),
                thoughts: Array.isArray(data.thoughts)
                  ? normalizeThoughtOrder(data.thoughts as Thought[])
                  : [],
                route: typeof data.route === "string" ? data.route : undefined,
                app_command: validatedAppCmd,
              };
            }
            if (event === "error" && isRecord(data)) {
              const msg =
                typeof data.message === "string"
                  ? data.message
                  : "Stream error";
              throw new Error(msg);
            }
          },
        });

        if (!donePayload) {
          throw new Error("Stream ended without a completion frame");
        }

        setStreamState((s) => ({
          status: "done",
          thoughts: donePayload!.thoughts,
          partialContent: donePayload!.content,
          error: null,
          lastDone: donePayload!,
          hasDeltas: s.hasDeltas,
          streamRoute: s.streamRoute,
        }));

        void qc.invalidateQueries({ queryKey: sessionKeys.detailInfinite(sessionId) });
        void qc.invalidateQueries({ queryKey: sessionKeys.list() });

        return donePayload;
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error(String(err ?? "Unknown error"));
        rollback();
        setStreamState({
          status: "error",
          thoughts: [],
          partialContent: "",
          error,
          lastDone: null,
          hasDeltas: false,
          streamRoute: null,
        });
        return null;
      } finally {
        setIsSending(false);
        abortRef.current = null;
      }
    },
    [qc],
  );

  return {
    sendMessage,
    isPending: isSending,
    streamState,
    resetStreamUi: () =>
      setStreamState({
        status: "idle",
        thoughts: [],
        partialContent: "",
        error: null,
        lastDone: null,
        hasDeltas: false,
        streamRoute: null,
      }),
  };
}
