import { useState, useRef, useEffect } from "react";

interface Props {
  text: string;
  children?: React.ReactNode;
}

/**
 * Dependency-free hover/tap tooltip (design §T5).
 * - Desktop: shows on hover/focus.
 * - Mobile: toggles on tap (click).
 * Uses existing theme tokens; no global CSS additions.
 */
export default function InfoTip({ text, children }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  // Close on outside click (mobile tap-away)
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    // Delay adding the listener so the same click that opened doesn't close
    const id = setTimeout(() => {
      document.addEventListener("click", handler);
    }, 0);
    return () => {
      clearTimeout(id);
      document.removeEventListener("click", handler);
    };
  }, [open]);

  return (
    <span
      ref={ref}
      className="relative inline-flex items-center"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onClick={(e) => {
        e.stopPropagation();
        setOpen((v) => !v);
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") setOpen(false);
      }}
      role="button"
      tabIndex={0}
      aria-label={text}
    >
      {children ?? (
        <span className="ml-0.5 inline-flex h-3.5 w-3.5 cursor-help items-center justify-center rounded-full bg-surface-2 text-2xs font-bold leading-none text-text-muted hover:bg-surface-3 hover:text-text-main">
          ?
        </span>
      )}
      {open && (
        <span className="absolute bottom-full left-1/2 z-50 mb-1.5 w-44 -translate-x-1/2 rounded-lg bg-surface-2 px-2.5 py-1.5 text-2xs leading-relaxed text-text-main shadow-soft-pink ring-1 ring-border-soft">
          {text}
        </span>
      )}
    </span>
  );
}
