interface Props {
  value: number;
  max: number;
  color: string;
}

export function MiniBar({ value, max, color }: Props) {
  const width = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="h-1.5 w-full overflow-hidden rounded bg-white/10">
      <div
        className="h-full rounded transition-[width] duration-1000 ease-out"
        style={{ width: `${width}%`, background: color }}
      />
    </div>
  );
}
