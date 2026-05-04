import type { ChatMessage } from "../api/client";

interface Props {
  message: ChatMessage;
  characterName?: string;
  pending?: boolean;
}

export default function MessageBubble({ message, characterName, pending }: Props) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex w-full animate-fade-in ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      <div className="flex max-w-[85%] flex-col gap-1 sm:max-w-[75%]">
        {!isUser && characterName && (
          <span className="px-1 text-[11px] font-medium text-fg-subtle">
            {characterName}
          </span>
        )}
        <div
          className={`whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed shadow-sm ${
            isUser
              ? "rounded-br-md bg-bubble-user-bg text-bubble-user-fg"
              : "rounded-bl-md bg-bubble-assistant-bg text-bubble-assistant-fg"
          } ${pending ? "opacity-70" : ""}`}
        >
          {message.content}
        </div>
      </div>
    </div>
  );
}
