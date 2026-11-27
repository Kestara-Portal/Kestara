type SectionLabelProps = {
  index: string;
  label: string;
  tone?: "default" | "on-brand";
};

/**
 * Motif identitas halaman: nomor section, garis tipis, lalu label.
 * Dipakai konsisten di setiap section sebagai penanda urutan bacaan,
 * bukan sebagai badge dekoratif.
 */
export function SectionLabel({ index, label, tone = "default" }: SectionLabelProps) {
  const isOnBrand = tone === "on-brand";

  return (
    <p className="flex items-center gap-3">
      <span
        aria-hidden="true"
        className={
          isOnBrand
            ? "text-[0.8125rem] font-medium tabular-nums text-white/85"
            : "text-[0.8125rem] font-medium tabular-nums text-brand"
        }
      >
        {index}
      </span>
      <span
        aria-hidden="true"
        className={isOnBrand ? "h-px w-7 bg-white/40" : "h-px w-7 bg-brand/40"}
      />
      <span
        className={
          isOnBrand
            ? "text-[0.8125rem] font-medium text-white/85"
            : "text-[0.8125rem] font-medium text-muted"
        }
      >
        {label}
      </span>
    </p>
  );
}