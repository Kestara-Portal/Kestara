interface MatchScoreProps {
  displayValue: string | null;
}

export default function MatchScore({ displayValue }: MatchScoreProps) {
  if (displayValue === null) {
    return (
      <p className="text-sm text-neutral-500">
        Skor kecocokan belum tersedia
      </p>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-2xl font-bold text-brand">
        {displayValue}
      </span>
      <span className="text-sm text-neutral-600">
        Skor kecocokan
      </span>
    </div>
  );
}
