"use client";

export interface TokenSelectorProps<T extends string> {
  label: string;
  options: T[];
  value: T;
  onChange: (value: T) => void;
}

export default function TokenSelector<T extends string>({
  label,
  options,
  value,
  onChange,
}: TokenSelectorProps<T>) {
  return (
    <div className="space-y-2">
      <p className="text-sm uppercase tracking-[0.24em] text-slate-500">{label}</p>
      <div className="grid grid-cols-3 gap-2">
        {options.map((option) => {
          const active = option === value;
          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              className={`rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                active
                  ? "border-pink-600 bg-pink-600 text-white shadow-lg shadow-pink-200/60"
                  : "border-slate-200 bg-white/90 text-slate-700 hover:border-slate-300"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}
