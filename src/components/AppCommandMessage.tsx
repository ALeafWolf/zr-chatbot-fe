import { useCallback } from "react";
import { FileText, Download, Info } from "lucide-react";
import type { ChatMessage } from "../api/client";
import type {
  FileExportResult,
  SessionStatusResult,
  SessionStatusFields,
  UnsupportedCommandResult,
} from "../api/appCommandTypes";
import {
  formatLabel,
  formatByteLength,
  formatTokenCount,
  formatCostUsd,
} from "../api/appCommandTypes";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AppCommandMessageProps {
  message: Pick<ChatMessage, "id" | "content" | "app_command">;
}

// ---------------------------------------------------------------------------
// File export card
// ---------------------------------------------------------------------------

function FileExportCard({ result }: { result: FileExportResult }) {
  const { artifact } = result;

  const handleDownload = useCallback(() => {
    const blob = new Blob([artifact.content], { type: artifact.mime_type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = artifact.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [artifact.content, artifact.mime_type, artifact.filename]);

  return (
    <div className="panel rounded-xl overflow-hidden">
      <div className="flex items-start gap-3 p-4">
        <div className="mt-0.5 shrink-0 rounded-lg bg-primary-pale p-2 text-primary-strong">
          <FileText size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="mb-2 text-xs text-text-muted">{result.message}</p>
          <p className="text-sm font-semibold">{artifact.title}</p>
          <p className="mt-1 text-xs text-text-muted">
            Document · {formatLabel(artifact.format)}
          </p>
          <p className="text-xs text-text-muted">
            {artifact.message_count}{" "}
            {artifact.message_count === 1 ? "message" : "messages"}
            {artifact.byte_length > 0
              ? ` · ${formatByteLength(artifact.byte_length)}`
              : ""}
          </p>
          <button
            type="button"
            onClick={handleDownload}
            className="btn-pink mt-3 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold"
          >
            <Download size={14} />
            Download
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Session status card
// ---------------------------------------------------------------------------

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2 text-xs">
      <span className="shrink-0 font-medium text-text-muted">{label}</span>
      <span className="truncate">{value}</span>
    </div>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="col-span-2 mt-2 border-b border-border-soft pb-1 text-xs font-bold text-text-muted first:mt-0">
      {children}
    </div>
  );
}

const MODE_LABEL: Record<string, string> = {
  canonical_live: "Live",
  pinned_scenario: "Scenario",
  sandbox: "Sandbox",
};

const COVERAGE_LABEL: Record<string, string> = {
  complete: "Complete",
  partial: "Partial",
  untracked: "Untracked",
};

function SessionStatusCard({ result }: { result: SessionStatusResult }) {
  const f: SessionStatusFields = result.fields;
  const pinnedParts: string[] = [];
  if (f.pinned_time) pinnedParts.push(`Time: ${f.pinned_time}`);
  if (f.pinned_location) pinnedParts.push(`Loc: ${f.pinned_location}`);

  return (
    <div className="panel rounded-xl overflow-hidden">
      <div className="flex items-start gap-3 p-4">
        <div className="mt-0.5 shrink-0 rounded-lg bg-primary-pale p-2 text-primary-strong">
          <Info size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="mb-2 text-xs text-text-muted">{result.message}</p>
          <p className="text-sm font-semibold">{f.display_title}</p>

          <div className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
            <SectionHeader>Session</SectionHeader>
            <FieldRow label="ID:" value={f.session_id.slice(0, 16) + "…"} />
            <FieldRow label="Mode:" value={MODE_LABEL[f.mode] ?? f.mode} />
            <FieldRow label="Scope:" value={f.continuity_scope} />
            {pinnedParts.length > 0 && (
              <FieldRow label="Pinned:" value={pinnedParts.join(" · ")} />
            )}

            <SectionHeader>Activity</SectionHeader>
            <FieldRow label="Turns:" value={String(f.completed_turns)} />
            <FieldRow label="Messages:" value={String(f.message_count)} />
            <FieldRow label="Roleplay:" value={String(f.roleplay_count)} />
            {f.app_command_count > 0 && (
              <FieldRow
                label="Commands:"
                value={String(f.app_command_count)}
              />
            )}
            {f.unsupported_count > 0 && (
              <FieldRow label="Other:" value={String(f.unsupported_count)} />
            )}

            <SectionHeader>
              Usage ({COVERAGE_LABEL[f.usage.coverage]})
            </SectionHeader>
            <FieldRow
              label="Input:"
              value={`${formatTokenCount(f.usage.input_tokens)} tokens`}
            />
            <FieldRow
              label="Output:"
              value={`${formatTokenCount(f.usage.output_tokens)} tokens`}
            />
            <FieldRow
              label="Total:"
              value={`${formatTokenCount(f.usage.total_tokens)} tokens`}
            />
            <FieldRow
              label="Cost:"
              value={formatCostUsd(f.usage.estimated_cost_usd)}
            />
            {f.usage.coverage !== "complete" &&
              f.usage.untracked_turn_count > 0 && (
                <FieldRow
                  label="Untracked:"
                  value={`${f.usage.untracked_turn_count} turn${f.usage.untracked_turn_count === 1 ? "" : "s"}`}
                />
              )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Unsupported command card
// ---------------------------------------------------------------------------

function UnsupportedCard({ result }: { result: UnsupportedCommandResult }) {
  return (
    <div className="panel rounded-xl overflow-hidden">
      <div className="flex items-start gap-3 p-4">
        <div className="mt-0.5 shrink-0 rounded-lg bg-primary-pale p-2 text-primary-strong">
          <Info size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Unrecognized Command</p>
          <p className="mt-1 text-xs text-text-muted">{result.message}</p>
          {result.available_commands.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {result.available_commands.map((cmd) => (
                <span
                  key={cmd}
                  className="rounded-md bg-primary-pale px-2 py-0.5 text-xs font-medium text-primary-strong"
                >
                  {cmd}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component — dispatches on the validated discriminated union
// ---------------------------------------------------------------------------

export default function AppCommandMessage({ message }: AppCommandMessageProps) {
  const payload = message.app_command;
  if (!payload) return null;

  switch (payload.kind) {
    case "file_export":
      return <FileExportCard result={payload} />;
    case "session_status":
      return <SessionStatusCard result={payload} />;
    case "unsupported":
      return <UnsupportedCard result={payload} />;
    default:
      return null;
  }
}
