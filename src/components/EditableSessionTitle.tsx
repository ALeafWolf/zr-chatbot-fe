import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import {
  SESSION_DISPLAY_TITLE_MAX_LEN,
} from "../api/client";
import { usePatchSessionDisplayTitle } from "../hooks/useSessions";
import { characterLabel } from "../lib/labels";

function normalizeStoredTitle(v: string | null | undefined): string | null {
  const t = v?.trim();
  return t && t.length > 0 ? t : null;
}

interface EditableSessionTitleProps {
  sessionId: string;
  characterId: string;
  displayTitle: string | null | undefined;
  variant: "sidebar" | "header";
  className?: string;
}

/**
 * Double-click to rename. Enter or blur saves (empty clears to default character label).
 * Escape cancels. Blur commits like Enter.
 */
export default function EditableSessionTitle({
  sessionId,
  characterId,
  displayTitle,
  variant,
  className = "",
}: EditableSessionTitleProps) {
  const { mutateAsync, reset, isPending, isError, error } =
    usePatchSessionDisplayTitle();
  const resolved =
    normalizeStoredTitle(displayTitle) ?? characterLabel(characterId);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(resolved);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) {
      setDraft(resolved);
    }
  }, [resolved, editing]);

  useEffect(() => {
    if (editing) {
      const el = inputRef.current;
      el?.focus();
      el?.select();
    }
  }, [editing]);

  const beginEdit = useCallback(
    (e?: MouseEvent) => {
      e?.preventDefault();
      e?.stopPropagation();
      if (isPending) return;
      reset();
      setDraft(resolved);
      setEditing(true);
    },
    [isPending, reset, resolved],
  );

  const cancelEdit = useCallback(() => {
    setDraft(resolved);
    setEditing(false);
    reset();
  }, [reset, resolved]);

  const commit = useCallback(async () => {
    const normalizedCurrent = normalizeStoredTitle(displayTitle);
    const nextStored =
      draft.trim().length === 0 ? null : draft.trim().slice(0, SESSION_DISPLAY_TITLE_MAX_LEN);

    if (nextStored === normalizedCurrent) {
      setEditing(false);
      return;
    }

    try {
      await mutateAsync({
        sessionId,
        display_title: nextStored,
      });
      setEditing(false);
    } catch {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [draft, displayTitle, mutateAsync, sessionId]);

  const onInputKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        void commit();
      } else if (e.key === "Escape") {
        e.preventDefault();
        cancelEdit();
      }
    },
    [cancelEdit, commit],
  );

  const TitleTag = variant === "header" ? "h1" : "div";
  const inputRing =
    variant === "header"
      ? "border-primary-light/40 focus-visible:ring-primary-light/30"
      : "border-border-soft focus-visible:ring-primary-pink/40";

  if (editing) {
    return (
      <div className="min-w-0">
        <input
          ref={inputRef}
          type="text"
          value={draft}
          maxLength={SESSION_DISPLAY_TITLE_MAX_LEN}
          disabled={isPending}
          aria-label="Conversation title"
          className={`${className} box-border w-full min-w-0 rounded-lg border-2 bg-white/95 px-2 py-0.5 font-inherit outline-none focus-visible:ring-2 ${inputRing}`}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onInputKeyDown}
          onBlur={() => void commit()}
          onClick={(e) => e.stopPropagation()}
        />
        {isError && error && (
          <div className="mt-1 truncate text-2xs text-danger-soft">
            {error.message}
          </div>
        )}
      </div>
    );
  }

  return (
    <TitleTag
      className={`${className} min-w-0 cursor-text rounded-lg outline-none hover:underline decoration-dotted underline-offset-2 ${isPending ? "opacity-60" : ""}`}
      title="Double-click to rename"
      onDoubleClick={beginEdit}
    >
      {resolved}
    </TitleTag>
  );
}
