import { EVERYDAY_ACTIONS, type EverydayAction } from "@/lib/types";

export function EverydayActions({ value, onChange }: {
  value: EverydayAction[];
  onChange: (actions: EverydayAction[]) => void;
}) {
  return (
    <fieldset className="everyday-actions">
      <legend>Everyday actions</legend>
      <p>Choose up to 4 actions.</p>
      {EVERYDAY_ACTIONS.map(([id, label]) => (
        <label className="check" key={id}>
          <input
            type="checkbox"
            checked={value.includes(id)}
            disabled={value.length >= 4 && !value.includes(id)}
            onChange={(event) => onChange(
              event.target.checked ? [...value, id] : value.filter((action) => action !== id),
            )}
          />
          <span>{label}</span>
        </label>
      ))}
    </fieldset>
  );
}
