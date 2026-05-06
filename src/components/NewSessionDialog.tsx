import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Loader2, X } from "lucide-react";
import { useCharacters, useCreateSession } from "../hooks/useSessions";
import ScopePicker from "./ScopePicker";
import ModePicker from "./ModePicker";
import type { ChatMode, ContinuityScope } from "../api/client";

interface Props {
  open: boolean;
  onClose: () => void;
}

const DEFAULT_CHARACTER = "zou_ran";
const DEFAULT_SCOPE: ContinuityScope = "main_married";
const DEFAULT_MODE: ChatMode = "canonical_live";

export default function NewSessionDialog({ open, onClose }: Props) {
  const navigate = useNavigate();
  const characters = useCharacters();
  const create = useCreateSession();

  const [characterId, setCharacterId] = useState(DEFAULT_CHARACTER);
  const [scope, setScope] = useState<ContinuityScope>(DEFAULT_SCOPE);
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
      requestAnimationFrame(() => {
        dialogRef.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus();
      });
    }
  }, [open]);

  if (!open || typeof document === "undefined") return null;

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

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 flex items-end justify-center bg-overlay p-0 sm:items-center sm:p-6 animate-fade-in"
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
        className="panel relative w-full max-w-lg overflow-hidden rounded-t-panel sm:rounded-panel"
      >
        <div className="section-card__header flex w-full items-center justify-between gap-3 px-5 py-3">
          <h2 id={titleId} className="text-base font-extrabold tracking-tight">
            Start a new conversation
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="-mr-2 rounded-xl p-2 text-primary-light hover:bg-white/10"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 bg-surface/90 px-5 py-5">
          <div>
            <label
              htmlFor={charId}
              className="mb-1.5 block text-xs font-extrabold uppercase tracking-wide text-text-muted"
            >
              Character
            </label>
            <select
              id={charId}
              data-autofocus
              value={characterId}
              onChange={(e) => setCharacterId(e.target.value)}
              disabled={characters.isLoading}
              className="block w-full rounded-xl border-2 border-border-soft bg-surface px-3 py-2 text-sm text-text-main shadow-soft-pink transition-colors hover:border-border-pink focus:border-primary-pink focus:outline-none disabled:opacity-50"
            >
              {(characters.data ?? [{ character_id: DEFAULT_CHARACTER, name: "左然" }]).map(
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
              className="mb-1.5 block text-xs font-extrabold uppercase tracking-wide text-text-muted"
            >
              Continuity scope
            </label>
            <ScopePicker id={scopeId} value={scope} onChange={setScope} />
          </div>

          <div>
            <span className="mb-1.5 block text-xs font-extrabold uppercase tracking-wide text-text-muted">
              Mode
            </span>
            <ModePicker value={mode} onChange={setMode} />
          </div>

          {mode === "pinned_scenario" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="pinned_time"
                  className="mb-1.5 block text-xs font-extrabold uppercase tracking-wide text-text-muted"
                >
                  Pinned time (optional)
                </label>
                <input
                  id="pinned_time"
                  type="text"
                  placeholder="e.g. 旖慕篇 第3章"
                  value={pinnedTime}
                  onChange={(e) => setPinnedTime(e.target.value)}
                  className="block w-full rounded-xl border-2 border-border-soft bg-surface px-3 py-2 text-sm text-text-main shadow-soft-pink focus:border-primary-pink focus:outline-none"
                />
              </div>
              <div>
                <label
                  htmlFor="pinned_location"
                  className="mb-1.5 block text-xs font-extrabold uppercase tracking-wide text-text-muted"
                >
                  Pinned location (optional)
                </label>
                <input
                  id="pinned_location"
                  type="text"
                  placeholder="e.g. 公寓"
                  value={pinnedLocation}
                  onChange={(e) => setPinnedLocation(e.target.value)}
                  className="block w-full rounded-xl border-2 border-border-soft bg-surface px-3 py-2 text-sm text-text-main shadow-soft-pink focus:border-primary-pink focus:outline-none"
                />
              </div>
            </div>
          )}

          {create.error && (
            <div className="rounded-xl border-2 border-border-soft bg-danger-pale px-3 py-2 text-xs text-danger-soft">
              {create.error.message}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 border-t-2 border-dotted border-border-soft pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-3 py-2 text-sm font-bold text-text-muted hover:bg-primary-pale hover:text-text-main"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={create.isPending}
              className="btn-pink inline-flex items-center gap-2 px-4 py-2 text-sm disabled:cursor-not-allowed"
            >
              {create.isPending && <Loader2 className="animate-spin" size={14} />}
              Start conversation
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
