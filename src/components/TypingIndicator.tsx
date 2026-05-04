interface Props {
  characterName?: string;
}

export default function TypingIndicator({ characterName }: Props) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={`${characterName ?? "Character"} is typing`}
      className="flex items-end gap-2 animate-fade-in"
    >
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-bubble-assistant-bg px-4 py-3 shadow-sm">
        <span
          className="typing-dot inline-block h-1.5 w-1.5 rounded-full bg-fg-muted"
          style={{ animationDelay: "0ms" }}
        />
        <span
          className="typing-dot inline-block h-1.5 w-1.5 rounded-full bg-fg-muted"
          style={{ animationDelay: "150ms" }}
        />
        <span
          className="typing-dot inline-block h-1.5 w-1.5 rounded-full bg-fg-muted"
          style={{ animationDelay: "300ms" }}
        />
      </div>
    </div>
  );
}
