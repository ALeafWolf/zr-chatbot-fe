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
      <div className="message-bubble flex items-center gap-1 px-4 py-3 shadow-soft-pink">
        <span
          className="typing-dot inline-block size-1.5 rounded-full bg-primary-strong"
          style={{ animationDelay: "0ms" }}
        />
        <span
          className="typing-dot inline-block size-1.5 rounded-full bg-primary-strong"
          style={{ animationDelay: "150ms" }}
        />
        <span
          className="typing-dot inline-block size-1.5 rounded-full bg-primary-strong"
          style={{ animationDelay: "300ms" }}
        />
      </div>
    </div>
  );
}
