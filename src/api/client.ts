import { z } from "zod";

/**
 * Shared base URL. In dev we rely on the Vite proxy (`/api` → backend).
 * In production we read VITE_BACKEND_ORIGIN if set, else assume same-origin.
 */
const BASE_URL = import.meta.env.VITE_BACKEND_ORIGIN ?? "";

/* ---------- Shared schemas ---------- */

export const ChatModeSchema = z.enum([
  "canonical_live",
  "pinned_scenario",
  "sandbox",
]);
export type ChatMode = z.infer<typeof ChatModeSchema>;

/** Main-world continuity scopes — must match backend `AVAILABLE_SCOPES`. */
export const ContinuityScopeSchema = z.enum([
  "main_pre_relationship",
  "main_situationship",
  "main_relationship",
  "main_engaged",
  "main_married",
]);
export type ContinuityScope = z.infer<typeof ContinuityScopeSchema>;

/** Legacy persisted sessions may still use the old key; display-only support. */
export const ContinuityScopeStoredSchema = z.union([
  ContinuityScopeSchema,
  z.literal("main_sweet"),
]);

export const CharacterSchema = z.object({
  character_id: z.string(),
  name: z.string(),
});
export type Character = z.infer<typeof CharacterSchema>;

export const ScopeSchema = z.object({
  scope: ContinuityScopeSchema,
});
export type Scope = z.infer<typeof ScopeSchema>;

export const SessionSummarySchema = z.object({
  session_id: z.string(),
  character_id: z.string(),
  mode: ChatModeSchema,
  continuity_scope: ContinuityScopeStoredSchema,
  session_summary: z.string().nullable().optional(),
  created_at: z.union([z.string(), z.date()]).transform((v) => new Date(v)),
  updated_at: z.union([z.string(), z.date()]).transform((v) => new Date(v)),
});
export type SessionSummary = z.infer<typeof SessionSummarySchema>;

export const ThoughtSchema = z.object({
  kind: z.string(),
  text: z.string(),
  ts: z.number(),
  meta: z.unknown().optional(),
});
export type Thought = z.infer<typeof ThoughtSchema>;

export const ChatMessageSchema = z.object({
  id: z.string(),
  role: z.enum(["user", "assistant"]),
  content: z.string(),
  turn_index: z.number(),
  created_at: z.union([z.string(), z.date()]).transform((v) => new Date(v)),
  thoughts: z.preprocess(
    (v) => (Array.isArray(v) ? v : []),
    z.array(ThoughtSchema),
  ),
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export const SessionDetailSchema = z.object({
  session_id: z.string(),
  character_id: z.string(),
  mode: ChatModeSchema,
  continuity_scope: ContinuityScopeStoredSchema,
  pinned_time: z.string().nullable().optional(),
  pinned_location: z.string().nullable().optional(),
  session_summary: z.string().nullable().optional(),
  created_at: z.union([z.string(), z.date()]).transform((v) => new Date(v)),
  updated_at: z.union([z.string(), z.date()]).transform((v) => new Date(v)),
  messages: z.array(ChatMessageSchema),
});
export type SessionDetail = z.infer<typeof SessionDetailSchema>;

export const SendMessageReplySchema = z.object({
  message_id: z.string(),
  content: z.string(),
  turn_index: z.number(),
  was_rewritten: z.boolean(),
  was_deflected: z.boolean(),
});
export type SendMessageReply = z.infer<typeof SendMessageReplySchema>;

export const CreateSessionResponseSchema = z.object({
  session_id: z.string(),
});
export type CreateSessionResponse = z.infer<typeof CreateSessionResponseSchema>;

/* ---------- Request payloads ---------- */

export interface CreateSessionInput {
  character_id: string;
  mode: ChatMode;
  continuity_scope: ContinuityScope;
  pinned_time?: string;
  pinned_location?: string;
}

/* ---------- Errors ---------- */

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

/* ---------- Core fetch wrapper ---------- */

async function rawRequest(path: string, init: RequestInit): Promise<unknown> {
  // Only advertise a JSON content-type when we're actually sending a body.
  // Fastify's default parser rejects empty bodies tagged as application/json
  // (FST_ERR_CTP_EMPTY_JSON_BODY → 400), which broke bodyless DELETE requests.
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...((init.headers as Record<string, string> | undefined) ?? {}),
  };
  if (init.body != null) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers,
  });

  if (res.status === 204) return undefined;

  let body: unknown;
  const text = await res.text();
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  if (!res.ok) {
    const msg =
      (body && typeof body === "object" && "error" in body
        ? String((body as { error: unknown }).error)
        : null) ?? `Request failed: ${res.status}`;
    throw new ApiError(msg, res.status, body);
  }

  return body;
}

async function requestParsed<S extends z.ZodTypeAny>(
  path: string,
  init: RequestInit,
  schema: S,
): Promise<z.output<S>> {
  const body = await rawRequest(path, init);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError(
      `Response validation failed for ${path}: ${parsed.error.message}`,
      200,
      body,
    );
  }
  return parsed.data;
}

/* ---------- API surface ---------- */

export const api = {
  listCharacters(signal?: AbortSignal): Promise<Character[]> {
    return requestParsed("/api/characters", { method: "GET", signal }, z.array(CharacterSchema));
  },

  listScopes(signal?: AbortSignal): Promise<Scope[]> {
    return requestParsed("/api/scopes", { method: "GET", signal }, z.array(ScopeSchema));
  },

  listModes(signal?: AbortSignal): Promise<ChatMode[]> {
    return requestParsed("/api/modes", { method: "GET", signal }, z.array(ChatModeSchema));
  },

  listSessions(signal?: AbortSignal): Promise<SessionSummary[]> {
    return requestParsed("/api/sessions", { method: "GET", signal }, z.array(SessionSummarySchema));
  },

  getSession(sessionId: string, signal?: AbortSignal): Promise<SessionDetail> {
    return requestParsed(
      `/api/sessions/${encodeURIComponent(sessionId)}?page=0&page_size=200`,
      { method: "GET", signal },
      SessionDetailSchema,
    );
  },

  createSession(input: CreateSessionInput): Promise<CreateSessionResponse> {
    return requestParsed(
      "/api/sessions",
      { method: "POST", body: JSON.stringify(input) },
      CreateSessionResponseSchema,
    );
  },

  async deleteSession(sessionId: string): Promise<void> {
    await rawRequest(`/api/sessions/${encodeURIComponent(sessionId)}`, {
      method: "DELETE",
    });
  },

  sendMessage(sessionId: string, content: string): Promise<SendMessageReply> {
    return requestParsed(
      `/api/sessions/${encodeURIComponent(sessionId)}/messages`,
      { method: "POST", body: JSON.stringify({ content }) },
      SendMessageReplySchema,
    );
  },
};
