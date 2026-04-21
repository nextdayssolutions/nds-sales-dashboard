interface Props {
  value: number;
  showLabel?: boolean;
}

export function RelationDots({ value, showLabel = true }: Props) {
  const colorFor = (i: number) => {
    if (i >= value) return "rgba(255,255,255,0.1)";
    if (value >= 8) return "#00E5A0";
    if (value >= 5) return "#00D4FF";
    return "#FFB830";
  };

  return (
    <div className="flex items-center gap-[3px]">
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className="h-2 w-2 rounded-full transition-colors"
          style={{ background: colorFor(i) }}
        />
      ))}
      {showLabel && (
        <span className="ml-1.5 text-[11px] text-white/50">{value}/10</span>
      )}
    </div>
  );
}
