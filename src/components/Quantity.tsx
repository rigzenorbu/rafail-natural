"use client";

export default function Quantity({
  value,
  onChange,
  max = 50,
  small = false,
}: {
  value: number;
  onChange: (n: number) => void;
  max?: number;
  small?: boolean;
}) {
  return (
    <div className={`qty ${small ? "qty-sm" : ""}`}>
      <button type="button" onClick={() => onChange(value - 1)} disabled={value <= 1} aria-label="Decrease">−</button>
      <span>{value}</span>
      <button type="button" onClick={() => onChange(value + 1)} disabled={value >= max} aria-label="Increase">+</button>
    </div>
  );
}
