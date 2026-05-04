import { useEffect, useId, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, X } from "lucide-react";
import { useCharacters, useCreateSession } from "../hooks/useSessions";
import ScopePicker from "./ScopePicker";
import ModePicker from "./ModePicker";
import type { ChatMode } from "../api/client";

interface Props {
  open: boolean;
  onClose: () => void;
}

const DEFAULT_CHARACTER = "zou_ran";
const DEFAULT_SCOPE = "main_sweet";
const DEFAULT_MODE: ChatMode = "canonical_live";

export default function NewSessionDialog({ open, onClose }: Props) {
  const navigate = useNavigate();
  const characters = useCharacters();
  const create = useCreateSession();

  const [characterId, setCharacterId] = useState(DEFAULT_CHARACTER);
  const [scope, setScope] = useState(DEFAULT_SCOPE);
  const [mode, setMode] = useState<ChatMode>(DEFAULT_MODE);
  const [pinnedTime, setPinnedTime] = useState("");
  const [pinnedLocation, setPinnedLocation] = useState("");

  const charId = useId();
  const scopeId = useId();
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setCharacterId(DEFAULT_CHARACTER);
    setScope(DEFAULT_SCOPE);
    setMode(DEFAULT_MODE);
    setPinnedTime("");
    setPinnedLocation("");
    create.reset();
    // `create` is a new object each render; depending on it would reset the
    // mutation state every render and break the pending → onSuccess flow.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      // delay so the dialog is in the DOM before focusing
      requestAnimationFrame(() => {
        dialogRef.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus();
      });
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    create.mutate(
      {
        character_id: characterId,
        mode,
        continuity_scope: scope,
        pinned_time: mode === "pinned_scenario" ? pinnedTime || undefined : undefined,
        pinned_location:
          mode === "pinned_scenario" ? pinnedLocation || undefined : undefined,
      },
      {
        onSuccess: ({ session_id }) => {
          onClose();
          navigate(`/sessions/${session_id}`);
        },
      },
    );
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-[60] flex items-end justify-center bg-overlay p-0 sm:items-center sm:p-6 animate-fade-in"
    >
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 -z-10"
        onClick={onClose}
        tabIndex={-1}
      />
      <div
        ref={dialogRef}
        className="relative w-full max-w-lg overflow-hidden rounded-t-2xl bg-surface shadow-2xl sm:rounded-2xl"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 id={titleId} className="text-base font-semibold tracking-tight">
            Start a new conversation
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="-mr-2 rounded-lg p-2 text-fg-muted hover:bg-surface-hover hover:text-fg"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-5 py-5">
          <div>
            <label
              htmlFor={charId}
              className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-fg-muted"
            >
              Character
            </label>
            <select
              id={charId}
              data-autofocus
              value={characterId}
              onChange={(e) => setCharacterId(e.target.value)}
              disabled={characters.isLoading}
              className="block w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-fg shadow-sm transition-colors hover:border-border-strong focus:border-accent focus:outline-none disabled:opacity-50"
            >
              {(characters.data ?? [{ character_id: DEFAULT_CHARACTER, name: "左然 (Zou Ran)" }]).map(
                (c) => (
                  <option key={c.character_id} value={c.character_id}>
                    {c.name}
                  </option>
                ),
              )}
            </select>
          </div>

          <div>
            <label
              htmlFor={scopeId}
              className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-fg-muted"
            >
              Continuity scope
            </label>
            <ScopePicker id={scopeId} value={scope} onChange={setScope} />
          </div>

          <div>
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-fg-muted">
              Mode
            </span>
            <ModePicker value={mode} onChange={setMode} />
          </div>

          {mode === "pinned_scenario" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="pinned_time"
                  className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-fg-muted"
                >
                  Pinned time (optional)
                </label>
                <input
                  id="pinned_time"
                  type="text"
                  placeholder="e.g. 旖慕篇 第3章"
                  value={pinnedTime}
                  onChange={(e) => setPinnedTime(e.target.value)}
                  className="block w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-fg shadow-sm focus:border-accent focus:outline-none"
                />
              </div>
              <div>
                <label
                  htmlFor="pinned_location"
                  className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-fg-muted"
                >
                  Pinned location (optional)
                </label>
                <input
                  id="pinned_location"
                  type="text"
                  placeholder="e.g. 公寓"
                  value={pinnedLocation}
                  onChange={(e) => setPinnedLocation(e.target.value)}
                  className="block w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-fg shadow-sm focus:border-accent focus:outline-none"
                />
              </div>
            </div>
          )}

          {create.error && (
            <div className="rounded-md bg-danger-soft px-3 py-2 text-xs text-danger">
              {create.error.message}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-3 py-2 text-sm font-medium text-fg-muted hover:bg-surface-hover hover:text-fg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={create.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition-colors hover:bg-accent-hover disabled:opacity-60"
            >
              {create.isPending && <Loader2 className="animate-spin" size={14} />}
              Start conversation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
