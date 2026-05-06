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
      className="block w-full rounded-xl border-2 border-border-soft bg-surface px-3 py-2 text-sm text-text-main shadow-soft-pink transition-colors hover:border-border-pink focus:border-primary-pink focus:outline-none disabled:opacity-50"
    >
      {(data ?? []).map((s) => (
        <option key={s.scope} value={s.scope}>
          {scopeLabel(s.scope)}
        </option>
      ))}
    </select>
  );
}
