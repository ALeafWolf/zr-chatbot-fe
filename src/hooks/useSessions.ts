import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import {
  api,
  type Character,
  type ChatMode,
  type CreateSessionInput,
  type CreateSessionResponse,
  type Scope,
  type SessionDetail,
  type SessionSummary,
} from "../api/client";

export const sessionKeys = {
  all: ["sessions"] as const,
  list: () => [...sessionKeys.all, "list"] as const,
  detail: (id: string) => [...sessionKeys.all, "detail", id] as const,
};

export const lookupKeys = {
  characters: ["lookup", "characters"] as const,
  scopes: ["lookup", "scopes"] as const,
  modes: ["lookup", "modes"] as const,
};

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

export function useSession(
  sessionId: string | undefined,
): UseQueryResult<SessionDetail> {
  return useQuery({
    queryKey: sessionId ? sessionKeys.detail(sessionId) : ["sessions", "detail", "none"],
    queryFn: ({ signal }) => api.getSession(sessionId!, signal),
    enabled: !!sessionId,
    staleTime: 5 * 1000,
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
      qc.removeQueries({ queryKey: sessionKeys.detail(sessionId) });
    },
  });
}
