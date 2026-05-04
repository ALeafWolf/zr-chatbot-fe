import type { ContinuityScope } from "../api/client";
import { useScopes } from "../hooks/useSessions";
import { scopeLabel } from "../lib/labels";

interface Props {
  value: ContinuityScope;
  onChange: (scope: ContinuityScope) => void;
  id?: string;
}

export default function ScopePicker({ value, onChange, id }: Props) {
  const { data, isLoading } = useScopes();

  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value as ContinuityScope)}
      disabled={isLoading}
      className="block w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-fg shadow-sm transition-colors hover:border-border-strong focus:border-accent focus:outline-none disabled:opacity-50"
    >
      {(data ?? []).map((s) => (
        <option key={s.scope} value={s.scope}>
          {scopeLabel(s.scope)}
        </option>
      ))}
    </select>
  );
}
