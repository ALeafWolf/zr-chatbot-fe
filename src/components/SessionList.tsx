import { Link, useNavigate, useParams } from "react-router-dom";
import { Loader2, MessageCircle, Trash2 } from "lucide-react";
import { useDeleteSession, useSessions } from "../hooks/useSessions";
import {
  formatRelativeTime,
  MODE_LABELS,
  scopeLabel,
} from "../lib/labels";
import EditableSessionTitle from "./EditableSessionTitle";

export default function SessionList() {
  const { data, isLoading, error } = useSessions();
  const { id: activeId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const deleteSession = useDeleteSession();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-text-soft">
        <Loader2 className="animate-spin" size={18} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-2 mt-3 rounded-xl border-2 border-border-soft bg-danger-pale px-3 py-2 text-13 text-danger-soft">
        Failed to load sessions: {error.message}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="px-3 py-10 text-center text-xs text-text-soft">
        No conversations yet. Start one above.
      </div>
    );
  }

  return (
    <ul className="record-list">
      {data.map((s) => {
        const isActive = s.session_id === activeId;
        const summary =
          s.session_summary?.trim() ||
          `${MODE_LABELS[s.mode]} · ${scopeLabel(s.continuity_scope)}`;
        return (
          <li key={s.session_id}>
            <div
              className={`record-row group ${
                isActive ? "bg-primary-pale/90" : ""
              }`}
            >
              <Link
                to={`/sessions/${s.session_id}`}
                className="flex min-w-0 flex-1 items-start gap-2.5"
              >
                <span
                  className={`mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border-2 border-border-soft ${
                    isActive
                      ? "bg-primary-pink text-white"
                      : "bg-primary-pale text-primary-strong"
                  }`}
                >
                  <MessageCircle size={14} />
                </span>
                <div className="min-w-0 flex-1">
                  <EditableSessionTitle
                    sessionId={s.session_id}
                    characterId={s.character_id}
                    displayTitle={s.display_title}
                    variant="sidebar"
                    className="truncate text-sm font-bold text-text-main"
                  />
                  <div className="truncate text-xs text-text-muted">
                    {summary}
                  </div>
                  <div className="mt-0.5 truncate text-xs text-text-soft">
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
                    deleteSession.mutate(s.session_id, {
                      onSuccess: () => {
                        if (s.session_id === activeId) {
                          navigate("/", { replace: true });
                        }
                      },
                    });
                  }
                }}
                className="invisible mt-1 rounded-lg p-1.5 text-text-soft hover:bg-surface-2 hover:text-danger-soft group-hover:visible focus-visible:visible"
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
