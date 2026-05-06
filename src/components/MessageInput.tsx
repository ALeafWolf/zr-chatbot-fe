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

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  }, [value]);

  const trimmed = value.trim();
  const canSend =
    !disabled &&
    !pending &&
    trimmed.length > 0 &&
    trimmed.length <= MAX_LEN;

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
      className="border-t-2 border-border-soft bg-surface/88 px-3 py-3 backdrop-blur-sm sm:px-4"
    >
      <div className="input-shell mx-auto max-w-3xl">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value.slice(0, MAX_LEN))}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder={placeholder}
          disabled={disabled}
          className="chat-textarea block min-h-9 w-0 min-w-0 flex-1 resize-none bg-transparent py-1.5 text-15 leading-6 text-text-main outline-none! placeholder:text-text-soft focus-visible:outline-none! focus-visible:outline-offset-0! focus-visible:ring-0 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={!canSend}
          aria-label="Send message"
          className="icon-button-send"
        >
          {pending ? (
            <Loader2 className="animate-spin" size={16} />
          ) : (
            <SendHorizontal size={16} />
          )}
        </button>
      </div>
      <div className="mx-auto mt-1.5 flex max-w-3xl items-center justify-between px-1 text-xs text-text-soft">
        <span>Enter to send · Shift+Enter for newline</span>
        <span
          className={
            value.length > MAX_LEN * 0.9 ? "font-bold text-warning-soft" : undefined
          }
          aria-live="polite"
        >
          {value.length}/{MAX_LEN}
        </span>
      </div>
    </form>
  );
}
