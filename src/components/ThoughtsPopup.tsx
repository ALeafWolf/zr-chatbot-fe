import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import type { Thought } from "../api/client";
import { THOUGHT_KIND_LABELS } from "../lib/labels";
import { mergeAdjacentNativeThoughts } from "../lib/thoughtDisplay";

interface Props {
  open: boolean;
  onClose: () => void;
  thoughts: Thought[];
}

export default function ThoughtsPopup({ open, onClose, thoughts }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      const el = panelRef.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) {
        onClose();
      }
    };
    window.addEventListener("mousedown", onPointer);
    return () => window.removeEventListener("mousedown", onPointer);
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  const mergedThoughts = mergeAdjacentNativeThoughts(thoughts);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 pb-10 backdrop-blur-[1px] sm:items-center sm:p-6"
      role="presentation"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Thought chain"
        className="max-h-[min(72vh,560px)] w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-surface shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="text-sm font-semibold tracking-tight">思绪片段</div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-fg-muted hover:bg-surface-muted hover:text-fg"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <div className="max-h-[min(60vh,480px)] space-y-3 overflow-y-auto px-4 py-4 scrollbar-thin">
          {mergedThoughts.map((t, idx) => (
            <div
              key={`${t.ts}-${idx}`}
              className="rounded-xl bg-surface-muted/60 px-3 py-2"
            >
              <div className="mb-1 flex items-center gap-2">
                <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] font-medium text-fg-subtle">
                  {THOUGHT_KIND_LABELS[t.kind] ?? t.kind}
                </span>
              </div>
              <div className="text-[13px] leading-relaxed text-fg">{t.text}</div>
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}
