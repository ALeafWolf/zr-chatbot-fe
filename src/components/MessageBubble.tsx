import { useState } from "react";
import { Brain } from "lucide-react";
import type { ChatMessage } from "../api/client";
import ThoughtsPopup from "./ThoughtsPopup";

interface Props {
  message: ChatMessage;
  characterName?: string;
  pending?: boolean;
}

export default function MessageBubble({ message, characterName, pending }: Props) {
  const isUser = message.role === "user";
  const [thoughtsOpen, setThoughtsOpen] = useState(false);

  const thoughts =
    message.role === "assistant" && message.thoughts.length > 0
      ? message.thoughts
      : [];

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
          className={`whitespace-pre-wrap wrap-break-word rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed shadow-sm ${
            isUser
              ? "rounded-br-md bg-bubble-user-bg text-bubble-user-fg"
              : "rounded-bl-md bg-bubble-assistant-bg text-bubble-assistant-fg"
          } ${pending ? "opacity-70" : ""}`}
        >
          {message.content}
        </div>

        {!isUser && thoughts.length > 0 && !pending && (
          <div className="px-1">
            <button
              type="button"
              onClick={() => setThoughtsOpen(true)}
              className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium text-fg-muted hover:bg-surface-muted hover:text-fg"
            >
              <Brain size={14} aria-hidden />
              查看思绪
            </button>
            <ThoughtsPopup
              open={thoughtsOpen}
              onClose={() => setThoughtsOpen(false)}
              thoughts={thoughts}
            />
          </div>
        )}
      </div>
    </div>
  );
}
