const chipCls = (on: boolean) =>
  `min-h-11 rounded-xl px-3 text-sm font-bold transition active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 ${on ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`;

/** Single-choice row of toggle chips (aria-pressed) */
export function ChipGroup<T extends string>({
  legend,
  options,
  value,
  onChange,
}: {
  legend: string;
  options: readonly { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
}) {
  return (
    <fieldset className="flex flex-wrap gap-2">
      <legend className="mb-1 text-sm font-semibold text-slate-700">{legend}</legend>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={value === o.id}
          onClick={() => onChange(o.id)}
          className={chipCls(value === o.id)}
        >
          {o.label}
        </button>
      ))}
    </fieldset>
  );
}
