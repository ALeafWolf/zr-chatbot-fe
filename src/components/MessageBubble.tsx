import { useState } from "react";
import { Brain } from "lucide-react";
import type { ChatMessage } from "../api/client";
import ThoughtsPopup from "./ThoughtsPopup";

interface Props {
  message: ChatMessage;
  characterName?: string;
  pending?: boolean;
}

export default function MessageBubble({
  message,
  characterName,
  pending,
}: Props) {
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
      <div className={`flex flex-col gap-1 ${isUser ? "items-end" : "items-start"}`}>
        {!isUser && characterName && (
          <span className="px-1 text-xs font-semibold text-text-soft">
            {characterName}
          </span>
        )}
        <div
          className={`message-bubble text-15 leading-relaxed shadow-soft-pink whitespace-pre-wrap wrap-break-word ${
            isUser ? "message-bubble--user" : ""
          } ${pending ? "opacity-70" : ""}`}
        >
          {message.content}
        </div>

        {!isUser && thoughts.length > 0 && !pending && (
          <div className="px-1">
            <button
              type="button"
              onClick={() => setThoughtsOpen(true)}
              className="inline-flex items-center gap-1 rounded-full border-2 border-border-soft bg-primary-pale px-2 py-1 text-xs font-bold text-primary-strong hover:bg-surface-2"
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
