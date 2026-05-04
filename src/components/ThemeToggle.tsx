import { Monitor, Moon, Sun } from "lucide-react";
import { useThemeStore, type ThemePreference } from "../stores/themeStore";

const OPTIONS: Array<{ value: ThemePreference; label: string; icon: React.ComponentType<{ size?: number }> }> = [
  { value: "light", label: "Light theme", icon: Sun },
  { value: "system", label: "System theme", icon: Monitor },
  { value: "dark", label: "Dark theme", icon: Moon },
];

export default function ThemeToggle() {
  const preference = useThemeStore((s) => s.preference);
  const setPreference = useThemeStore((s) => s.setPreference);

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className="inline-flex items-center rounded-lg border border-border bg-surface-muted p-0.5"
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const active = preference === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            title={label}
            onClick={() => setPreference(value)}
            className={`inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
              active
                ? "bg-surface text-fg shadow-sm"
                : "text-fg-subtle hover:text-fg"
            }`}
          >
            <Icon size={14} />
          </button>
        );
      })}
    </div>
  );
}
