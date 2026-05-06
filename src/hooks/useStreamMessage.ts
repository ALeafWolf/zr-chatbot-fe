import { useCallback, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { postMessagesStream } from "../api/streamClient";
import type { ChatMessage, SessionDetail, Thought } from "../api/client";
import { joinNativeThoughtText } from "../lib/thoughtDisplay";
import { sessionKeys } from "./useSessions";

interface StreamArgs {
  sessionId: string;
  content: string;
}

interface OptimisticContext {
  previous: SessionDetail | undefined;
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
}

export interface StreamState {
  status: StreamStatus;
  thoughts: Thought[];
  partialContent: string;
  error: Error | null;
  lastDone: DonePayload | null;
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
  });

  const [isSending, setIsSending] = useState(false);

  const sendMessage = useCallback(
    async ({ sessionId, content }: StreamArgs): Promise<DonePayload | null> => {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;

      const key = sessionKeys.detail(sessionId);
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<SessionDetail>(key);

      const tempId = `temp-${Date.now()}`;
      const now = new Date();
      const lastTurn = previous?.messages.at(-1)?.turn_index ?? 0;

      const optimisticUser: ChatMessage = {
        id: `${tempId}-user`,
        role: "user",
        content,
        turn_index: lastTurn + 1,
        created_at: now,
        thoughts: [],
      };

      const ctx: OptimisticContext = { previous, tempId };

      if (previous) {
        qc.setQueryData<SessionDetail>(key, {
          ...previous,
          updated_at: now,
          messages: [...previous.messages, optimisticUser],
        });
      }

      setStreamState({
        status: "thinking",
        thoughts: [],
        partialContent: "",
        error: null,
        lastDone: null,
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
                const prev = s.thoughts;
                const last = prev[prev.length - 1];
                if (incoming.kind === "native" && last?.kind === "native") {
                  return {
                    ...s,
                    status: "thinking",
                    thoughts: [
                      ...prev.slice(0, -1),
                      {
                        ...last,
                        text: joinNativeThoughtText(last.text, incoming.text),
                      },
                    ],
                  };
                }
                return {
                  ...s,
                  status: "thinking",
                  thoughts: [...prev, incoming],
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
              }));
            }
            if (event === "done" && isRecord(data)) {
              donePayload = {
                message_id: String(data.message_id ?? ""),
                content: String(data.content ?? ""),
                turn_index: Number(data.turn_index ?? 0),
                was_rewritten: Boolean(data.was_rewritten),
                was_deflected: Boolean(data.was_deflected),
                thoughts: Array.isArray(data.thoughts)
                  ? (data.thoughts as Thought[])
                  : [],
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

        setStreamState({
          status: "done",
          thoughts: donePayload.thoughts,
          partialContent: donePayload.content,
          error: null,
          lastDone: donePayload,
        });

        void qc.invalidateQueries({ queryKey: sessionKeys.detail(sessionId) });
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
      }),
  };
}
