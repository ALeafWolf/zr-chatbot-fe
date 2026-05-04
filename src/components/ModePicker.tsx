import { useModes } from "../hooks/useSessions";
import type { ChatMode } from "../api/client";
import { MODE_DESCRIPTIONS, MODE_LABELS } from "../lib/labels";

interface Props {
  value: ChatMode;
  onChange: (mode: ChatMode) => void;
  name?: string;
}

export default function ModePicker({ value, onChange, name = "mode" }: Props) {
  const { data, isLoading } = useModes();
  const modes = data ?? (["canonical_live", "pinned_scenario", "sandbox"] as ChatMode[]);

  return (
    <div role="radiogroup" aria-label="Mode" className="grid gap-2">
      {modes.map((mode) => {
        const active = mode === value;
        return (
          <label
            key={mode}
            className={`relative flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors ${
              active
                ? "border-accent bg-accent-soft"
                : "border-border bg-surface hover:bg-surface-hover"
            } ${isLoading ? "opacity-60" : ""}`}
          >
            <input
              type="radio"
              name={name}
              value={mode}
              checked={active}
              onChange={() => onChange(mode)}
              className="sr-only"
            />
            <span
              aria-hidden
              className={`mt-1 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border-2 ${
                active ? "border-accent" : "border-border-strong"
              }`}
            >
              {active && (
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              )}
            </span>
            <span className="min-w-0">
              <span className="block font-medium text-fg">
                {MODE_LABELS[mode]}
              </span>
              <span className="mt-0.5 block text-xs text-fg-muted">
                {MODE_DESCRIPTIONS[mode]}
              </span>
            </span>
          </label>
        );
      })}
    </div>
  );
}
