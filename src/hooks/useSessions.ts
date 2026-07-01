import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
  type UseInfiniteQueryResult,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import {
  api,
  ApiError,
  type AxisState,
  type Character,
  type ChatMessage,
  type ChatMode,
  type CreateSessionInput,
  type CreateSessionResponse,
  type PatchSessionResponse,
  type PatchSessionInput,
  type Scope,
  type SessionDetail,
  type SessionSummary,
} from "../api/client";

export const SESSION_MESSAGE_PAGE_SIZE = 100;

export const sessionKeys = {
  all: ["sessions"] as const,
  list: () => [...sessionKeys.all, "list"] as const,
  detail: (id: string) => [...sessionKeys.all, "detail", id] as const,
  detailInfinite: (id: string) => [...sessionKeys.detail(id), "infinite"] as const,
  axisState: (id: string) => [...sessionKeys.all, "axisState", id] as const,
};

export const lookupKeys = {
  characters: ["lookup", "characters"] as const,
  scopes: ["lookup", "scopes"] as const,
  modes: ["lookup", "modes"] as const,
};

/** Chronological messages: older pages appended before newer pages; dedupe by id. */
export function mergeSessionPages(pages: SessionDetail[]): ChatMessage[] {
  const merged = [...pages].reverse().flatMap((p) => p.messages);
  const byId = new Map<string, ChatMessage>();
  for (const m of merged) {
    if (!byId.has(m.id)) byId.set(m.id, m);
  }
  return Array.from(byId.values());
}

/** Header fields from the newest-fetched page; messages replaced by merged history. */
export function sessionDetailFromPages(pages: SessionDetail[]): SessionDetail | null {
  if (!pages.length) return null;
  return { ...pages[0], messages: mergeSessionPages(pages) };
}

export function useCharacters(): UseQueryResult<Character[]> {
  return useQuery({
    queryKey: lookupKeys.characters,
    queryFn: ({ signal }) => api.listCharacters(signal),
    staleTime: 5 * 60 * 1000,
  });
}

export function useScopes(): UseQueryResult<Scope[]> {
  return useQuery({
    queryKey: lookupKeys.scopes,
    queryFn: ({ signal }) => api.listScopes(signal),
    staleTime: 5 * 60 * 1000,
  });
}

export function useModes(): UseQueryResult<ChatMode[]> {
  return useQuery({
    queryKey: lookupKeys.modes,
    queryFn: ({ signal }) => api.listModes(signal),
    staleTime: 5 * 60 * 1000,
  });
}

export function useSessions(): UseQueryResult<SessionSummary[]> {
  return useQuery({
    queryKey: sessionKeys.list(),
    queryFn: ({ signal }) => api.listSessions(signal),
    staleTime: 30 * 1000,
  });
}

export function useSessionDetailInfinite(
  sessionId: string | undefined,
): UseInfiniteQueryResult<InfiniteData<SessionDetail, number>, Error> {
  return useInfiniteQuery({
    queryKey: sessionId ? sessionKeys.detailInfinite(sessionId) : ["sessions", "detail", "none"],
    queryFn: ({ pageParam, signal }) =>
      api.getSession(sessionId!, signal, {
        page: pageParam,
        page_size: SESSION_MESSAGE_PAGE_SIZE,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _all, lastPageParam) =>
      lastPage.messages.length < SESSION_MESSAGE_PAGE_SIZE ? undefined : lastPageParam + 1,
    enabled: !!sessionId,
    staleTime: 5 * 1000,
  });
}

export function useAxisState(
  sessionId: string | undefined,
): UseQueryResult<AxisState | null> {
  return useQuery({
    queryKey: sessionKeys.axisState(sessionId ?? "none"),
    queryFn: async ({ signal }) => {
      try {
        return await api.getAxisState(sessionId!, signal);
      } catch (err) {
        // 404 (session not found) is expected during navigation; return null
        if (err instanceof ApiError && err.status === 404) {
          return null;
        }
        throw err;
      }
    },
    enabled: !!sessionId,
    staleTime: 10 * 1000,
    retry: false,
  });
}

export function useCreateSession(): UseMutationResult<
  CreateSessionResponse,
  Error,
  CreateSessionInput
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input) => api.createSession(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: sessionKeys.list() });
    },
  });
}

export function useDeleteSession(): UseMutationResult<void, Error, string> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sessionId) => api.deleteSession(sessionId),
    onSuccess: (_data, sessionId) => {
      void qc.invalidateQueries({ queryKey: sessionKeys.list() });
      qc.removeQueries({
        queryKey: sessionKeys.detail(sessionId),
        exact: false,
      });
    },
  });
}

export function usePatchSession(): UseMutationResult<
  PatchSessionResponse,
  Error,
  { sessionId: string } & PatchSessionInput
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, ...patch }) =>
      api.patchSession(sessionId, patch),
    onSuccess: (_data, { sessionId }) => {
      void qc.invalidateQueries({ queryKey: sessionKeys.list() });
      void qc.invalidateQueries({
        queryKey: sessionKeys.detailInfinite(sessionId),
      });
    },
  });
}
