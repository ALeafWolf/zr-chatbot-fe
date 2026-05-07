import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
  type InfiniteData,
} from "@tanstack/react-query";
import {
  api,
  type ChatMessage,
  type SendMessageReply,
  type SessionDetail,
} from "../api/client";
import { sessionKeys } from "./useSessions";

interface SendArgs {
  sessionId: string;
  content: string;
}

interface OptimisticContext {
  previous: InfiniteData<SessionDetail, number> | undefined;
  tempId: string;
}

/**
 * Optimistically inserts the user's message and a placeholder assistant turn
 * (rendered as TypingIndicator). On success the temp turns are replaced by
 * the canonical reply. On error we roll back so the input can be retried.
 */
export function useSendMessage(): UseMutationResult<
  SendMessageReply,
  Error,
  SendArgs,
  OptimisticContext
> {
  const qc = useQueryClient();

  return useMutation<SendMessageReply, Error, SendArgs, OptimisticContext>({
    mutationFn: ({ sessionId, content }) => api.sendMessage(sessionId, content),

    onMutate: async ({ sessionId, content }) => {
      const key = sessionKeys.detailInfinite(sessionId);
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<InfiniteData<SessionDetail, number>>(key);

      const tempId = `temp-${Date.now()}`;
      const now = new Date();
      const lastTurn = previous?.pages[0]?.messages.at(-1)?.turn_index ?? 0;

      const optimisticUser: ChatMessage = {
        id: `${tempId}-user`,
        role: "user",
        content,
        turn_index: lastTurn + 1,
        created_at: now,
        thoughts: [],
      };

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

      return { previous, tempId };
    },

    onError: (_err, { sessionId }, ctx) => {
      if (!ctx) return;
      const key = sessionKeys.detailInfinite(sessionId);
      if (ctx.previous) {
        qc.setQueryData(key, ctx.previous);
      } else {
        qc.removeQueries({ queryKey: key });
      }
    },

    onSuccess: (_reply, { sessionId }) => {
      void qc.invalidateQueries({ queryKey: sessionKeys.detailInfinite(sessionId) });
      void qc.invalidateQueries({ queryKey: sessionKeys.list() });
    },
  });
}
