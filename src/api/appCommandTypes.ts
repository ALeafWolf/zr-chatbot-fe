import { z } from "zod";

// ---------------------------------------------------------------------------
// Export options
// ---------------------------------------------------------------------------
export const ExportOptionsSchema = z.object({
  format: z.enum(["md", "json", "txt"]),
  turn_types: z.array(z.enum(["roleplay", "app_command", "unsupported"])).min(1),
  include_thoughts: z.boolean(),
});
export type ExportOptions = z.infer<typeof ExportOptionsSchema>;

// ---------------------------------------------------------------------------
// Export help section
// ---------------------------------------------------------------------------
export const ExportHelpSectionSchema = z.object({
  title: z.string(),
  items: z.array(z.string()),
});
export type ExportHelpSection = z.infer<typeof ExportHelpSectionSchema>;

// ---------------------------------------------------------------------------
// Command help result
// ---------------------------------------------------------------------------
export const CommandHelpResultSchema = z.object({
  kind: z.literal("command_help"),
  command: z.literal("show_export_help"),
  message: z.string(),
  title: z.string(),
  language: z.enum(["en", "zh"]),
  sections: z.array(ExportHelpSectionSchema),
});
export type CommandHelpResult = z.infer<typeof CommandHelpResultSchema>;

// ---------------------------------------------------------------------------
// File export artifact
// ---------------------------------------------------------------------------
export const FileExportArtifactSchema = z.object({
  title: z.string(),
  filename: z.string(),
  mime_type: z.string(),
  format: z.enum(["md", "json", "txt"]),
  content: z.string(),
  byte_length: z.number(),
  message_count: z.number(),
});
export type FileExportArtifact = z.infer<typeof FileExportArtifactSchema>;

// ---------------------------------------------------------------------------
// File export result
// ---------------------------------------------------------------------------
export const FileExportResultSchema = z.object({
  kind: z.literal("file_export"),
  command: z.literal("export_session_raw_turns"),
  message: z.string(),
  options: ExportOptionsSchema,
  artifact: FileExportArtifactSchema,
});
export type FileExportResult = z.infer<typeof FileExportResultSchema>;

// ---------------------------------------------------------------------------
// Session status fields
// ---------------------------------------------------------------------------
export const SessionStatusFieldsSchema = z.object({
  display_title: z.string(),
  session_id: z.string(),
  character_id: z.string(),
  mode: z.string(),
  continuity_scope: z.string(),
  pinned_time: z.string().nullable(),
  pinned_location: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  completed_turns: z.number(),
  message_count: z.number(),
  latest_turn_index: z.number(),
  roleplay_count: z.number(),
  app_command_count: z.number(),
  unsupported_count: z.number(),
  thinking: z.boolean(),
  temperature: z.number(),
  usage: z.object({
    input_tokens: z.number(),
    output_tokens: z.number(),
    total_tokens: z.number(),
    estimated_cost_usd: z.number().nullable(),
    coverage: z.enum(["complete", "partial", "untracked"]),
    untracked_turn_count: z.number(),
  }),
});
export type SessionStatusFields = z.infer<typeof SessionStatusFieldsSchema>;

// ---------------------------------------------------------------------------
// Session status result
// ---------------------------------------------------------------------------
export const SessionStatusResultSchema = z.object({
  kind: z.literal("session_status"),
  command: z.literal("show_session_status"),
  message: z.string(),
  fields: SessionStatusFieldsSchema,
});
export type SessionStatusResult = z.infer<typeof SessionStatusResultSchema>;

// ---------------------------------------------------------------------------
// Unsupported command result
// ---------------------------------------------------------------------------
export const UnsupportedCommandResultSchema = z.object({
  kind: z.literal("unsupported"),
  command: z.literal("unknown"),
  message: z.string(),
  available_commands: z.array(z.string()),
});
export type UnsupportedCommandResult = z.infer<
  typeof UnsupportedCommandResultSchema
>;

// ---------------------------------------------------------------------------
// Discriminated union
// ---------------------------------------------------------------------------
export const AppCommandResultSchema = z.discriminatedUnion("kind", [
  FileExportResultSchema,
  SessionStatusResultSchema,
  CommandHelpResultSchema,
  UnsupportedCommandResultSchema,
]);
export type AppCommandResult = z.infer<typeof AppCommandResultSchema>;

// ---------------------------------------------------------------------------
// Safe parser for optional app_command field — validates at the API boundary
// so downstream components receive a typed result or undefined.
// ---------------------------------------------------------------------------
export const OptionalAppCommandSchema = z.preprocess(
  (v) => {
    if (v == null) return undefined;
    const result = AppCommandResultSchema.safeParse(v);
    return result.success ? result.data : undefined;
  },
  AppCommandResultSchema.optional(),
);
export type OptionalAppCommand = z.infer<typeof OptionalAppCommandSchema>;

// ---------------------------------------------------------------------------
// Format label helpers
// ---------------------------------------------------------------------------
export function formatLabel(format: string): string {
  switch (format) {
    case "md":
      return "Markdown";
    case "json":
      return "JSON";
    case "txt":
      return "Text";
    default:
      return format.toUpperCase();
  }
}

export function formatByteLength(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

export function formatTokenCount(n: number): string {
  return n.toLocaleString();
}

export function formatCostUsd(cost: number | null): string {
  if (cost === null) return "Unknown";
  if (cost < 0.01) return `$${cost.toFixed(6)}`;
  return `$${cost.toFixed(4)}`;
}
