"use client";

import { Minus, Plus } from "lucide-react";

/** A − / + control for choosing how many to buy. `max` is the most that can be chosen right now. */
export function QuantityStepper({
  value,
  max,
  onChange,
  disabled = false,
}: {
  value: number;
  max: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}) {
  return (
    <div role="group" aria-label="Quantity" className="inline-flex items-center rounded-md border">
      <button
        type="button"
        aria-label="Decrease quantity"
        className="p-3 transition-colors hover:bg-muted disabled:opacity-40 disabled:hover:bg-transparent"
        disabled={disabled || value <= 1}
        onClick={() => onChange(value - 1)}
      >
        <Minus className="size-4" aria-hidden />
      </button>
      <output className="min-w-10 text-center text-base tabular-nums" aria-live="polite" aria-atomic>
        {value}
      </output>
      <button
        type="button"
        aria-label="Increase quantity"
        className="p-3 transition-colors hover:bg-muted disabled:opacity-40 disabled:hover:bg-transparent"
        disabled={disabled || value >= max}
        onClick={() => onChange(value + 1)}
      >
        <Plus className="size-4" aria-hidden />
      </button>
    </div>
  );
}
