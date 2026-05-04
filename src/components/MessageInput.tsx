import { useEffect, useRef, useState } from "react";
import { Loader2, SendHorizontal } from "lucide-react";

interface Props {
  onSend: (content: string) => void | Promise<void>;
  disabled?: boolean;
  pending?: boolean;
  placeholder?: string;
}

const MAX_LEN = 4000;

export default function MessageInput({
  onSend,
  disabled,
  pending,
  placeholder = "对左然说点什么…",
}: Props) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-grow textarea up to ~6 lines
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  }, [value]);

  const trimmed = value.trim();
  const canSend = !disabled && !pending && trimmed.length > 0 && trimmed.length <= MAX_LEN;

  const submit = () => {
    if (!canSend) return;
    const toSend = trimmed;
    setValue("");
    void onSend(toSend);
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="border-t border-border bg-surface/80 px-3 py-3 backdrop-blur sm:px-4"
    >
      <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border border-border bg-surface px-3 py-2 shadow-sm focus-within:border-accent">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value.slice(0, MAX_LEN))}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder={placeholder}
          disabled={disabled}
          className="block max-h-[180px] min-h-[24px] flex-1 resize-none bg-transparent text-[15px] leading-6 text-fg outline-none placeholder:text-fg-subtle disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={!canSend}
          aria-label="Send message"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-accent-fg transition-colors hover:bg-accent-hover disabled:bg-surface-muted disabled:text-fg-subtle"
        >
          {pending ? (
            <Loader2 className="animate-spin" size={16} />
          ) : (
            <SendHorizontal size={16} />
          )}
        </button>
      </div>
      <div className="mx-auto mt-1.5 flex max-w-3xl items-center justify-between px-1 text-[11px] text-fg-subtle">
        <span>Enter to send · Shift+Enter for newline</span>
        <span
          className={value.length > MAX_LEN * 0.9 ? "text-warning" : undefined}
          aria-live="polite"
        >
          {value.length}/{MAX_LEN}
        </span>
      </div>
    </form>
  );
}
