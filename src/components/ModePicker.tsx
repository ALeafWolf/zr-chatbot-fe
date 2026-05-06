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
            className={`relative flex cursor-pointer items-start gap-3 rounded-xl border-2 px-3 py-2.5 text-sm transition-colors ${
              active
                ? "border-primary-pink bg-primary-pale shadow-soft-pink"
                : "border-border-soft bg-surface hover:bg-primary-pale/60"
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
              className={`mt-1 flex size-3.5 shrink-0 items-center justify-center rounded-full border-2 ${
                active ? "border-primary-pink" : "border-border-soft"
              }`}
            >
              {active && (
                <span className="size-1.5 rounded-full bg-primary-pink" />
              )}
            </span>
            <span className="min-w-0">
              <span className="block font-bold text-text-main">
                {MODE_LABELS[mode]}
              </span>
              <span className="mt-0.5 block text-xs text-text-muted">
                {MODE_DESCRIPTIONS[mode]}
              </span>
            </span>
          </label>
        );
      })}
    </div>
  );
}
