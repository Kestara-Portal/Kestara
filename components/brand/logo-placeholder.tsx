type LogoPlaceholderProps = {
  size?: number;
  className?: string;
};

/**
 * Placeholder logo Kestara. Logo final belum disediakan, jadi area brand memakai
 * kotak netral dengan monogram. Ukuran area tetap agar penggantian logo nanti
 * tidak mengubah layout. Ganti komponen ini saja saat logo final tersedia.
 */
export function LogoPlaceholder({ size = 40, className }: LogoPlaceholderProps) {
  const classes = ["inline-flex items-center gap-2.5", className].filter(Boolean).join(" ");

  return (
    <span className={classes}>
      <span
        aria-hidden="true"
        style={{ width: size, height: size, fontSize: Math.round(size * 0.3) }}
        className="grid place-items-center rounded-[10px] border border-line bg-brand-soft font-semibold tracking-[0.02em] text-brand"
      >
        KS
      </span>
      <span className="text-[1.05rem] font-semibold tracking-tight text-foreground">Kestara</span>
    </span>
  );
}