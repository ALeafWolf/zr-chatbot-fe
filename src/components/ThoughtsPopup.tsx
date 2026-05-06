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
      className="fixed inset-0 z-50 flex items-end justify-center bg-overlay p-4 pb-10 backdrop-blur-sm sm:items-center sm:p-6"
      role="presentation"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Thought chain"
        className="thoughts-popup-shell panel flex w-full max-w-lg flex-col overflow-hidden"
      >
        <div className="section-card__header flex w-full shrink-0 items-center justify-between gap-2 px-4 py-3">
          <div className="text-sm font-extrabold tracking-tight">思绪片段</div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1 text-primary-light hover:bg-white/10"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <div className="thoughts-popup-body custom-scrollbar space-y-0 overflow-y-auto bg-surface/90 px-4 py-4">
          {mergedThoughts.map((t, idx) => (
            <div key={`${t.ts}-${idx}`}>
              {idx > 0 && <hr className="dotted-divider" />}
              <div className="thought-card">
                <div className="mb-1 flex items-center gap-2">
                  <span className="rounded-full bg-header-dark px-2 py-0.5 text-2xs font-extrabold text-primary-light">
                    {THOUGHT_KIND_LABELS[t.kind] ?? t.kind}
                  </span>
                </div>
                <div className="text-13 leading-relaxed text-text-main">{t.text}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}
