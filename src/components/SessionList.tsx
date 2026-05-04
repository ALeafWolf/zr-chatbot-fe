import { Link, useParams } from "react-router-dom";
import { Loader2, MessageCircle, Trash2 } from "lucide-react";
import { useDeleteSession, useSessions } from "../hooks/useSessions";
import {
  characterLabel,
  formatRelativeTime,
  MODE_LABELS,
  scopeLabel,
} from "../lib/labels";

export default function SessionList() {
  const { data, isLoading, error } = useSessions();
  const { id: activeId } = useParams<{ id: string }>();
  const deleteSession = useDeleteSession();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-fg-subtle">
        <Loader2 className="animate-spin" size={18} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-2 mt-3 rounded-md bg-danger-soft px-3 py-2 text-xs text-danger">
        Failed to load sessions: {error.message}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="px-3 py-10 text-center text-xs text-fg-subtle">
        No conversations yet. Start one above.
      </div>
    );
  }

  return (
    <ul className="space-y-0.5 py-1">
      {data.map((s) => {
        const isActive = s.session_id === activeId;
        const summary =
          s.session_summary?.trim() ||
          `${MODE_LABELS[s.mode]} · ${scopeLabel(s.continuity_scope)}`;
        return (
          <li key={s.session_id}>
            <div
              className={`group flex items-start gap-2 rounded-lg px-2.5 py-2 transition-colors ${
                isActive
                  ? "bg-accent-soft"
                  : "hover:bg-surface-hover"
              }`}
            >
              <Link
                to={`/sessions/${s.session_id}`}
                className="flex min-w-0 flex-1 items-start gap-2.5"
              >
                <span
                  className={`mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${
                    isActive
                      ? "bg-accent text-accent-fg"
                      : "bg-surface-muted text-fg-muted"
                  }`}
                >
                  <MessageCircle size={14} />
                </span>
                <div className="min-w-0 flex-1">
                  <div
                    className={`truncate text-sm font-medium ${
                      isActive ? "text-fg" : "text-fg"
                    }`}
                  >
                    {characterLabel(s.character_id)}
                  </div>
                  <div className="truncate text-xs text-fg-subtle">{summary}</div>
                  <div className="mt-0.5 truncate text-[11px] text-fg-subtle">
                    {formatRelativeTime(s.updated_at)}
                  </div>
                </div>
              </Link>
              <button
                type="button"
                onClick={() => {
                  if (
                    window.confirm(
                      "Delete this conversation? It will be soft-deleted.",
                    )
                  ) {
                    deleteSession.mutate(s.session_id);
                  }
                }}
                className="invisible mt-1 rounded-md p-1.5 text-fg-subtle hover:bg-surface-muted hover:text-danger group-hover:visible focus-visible:visible"
                aria-label="Delete conversation"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
