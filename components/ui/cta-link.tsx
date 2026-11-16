import Link from "next/link";
import type { ReactNode } from "react";

type CtaVariant = "primary" | "secondary" | "ghost" | "on-brand";
type CtaSize = "md" | "lg";

type CtaLinkProps = {
  href: string;
  children: ReactNode;
  variant?: CtaVariant;
  size?: CtaSize;
  className?: string;
};

const base =
  "inline-flex items-center justify-center rounded-[10px] font-medium transition-colors duration-150";

const sizes: Record<CtaSize, string> = {
  md: "min-h-11 px-5 text-sm",
  lg: "min-h-12 px-6 text-[0.95rem]",
};

const variants: Record<CtaVariant, string> = {
  primary: "bg-brand text-white hover:bg-brand-hover",
  secondary: "border border-control-border bg-white text-foreground hover:bg-brand-soft",
  ghost: "text-brand underline decoration-brand/40 underline-offset-4 hover:text-brand-dark hover:decoration-brand",
  "on-brand": "bg-white text-brand hover:bg-brand-soft",
};

export function CtaLink({
  href,
  children,
  variant = "primary",
  size = "md",
  className,
}: CtaLinkProps) {
  const sizeClasses = variant === "ghost" ? "min-h-12 pr-2" : sizes[size];
  const classes = [base, sizeClasses, variants[variant], className].filter(Boolean).join(" ");

  return (
    <Link href={href} className={classes}>
      {children}
    </Link>
  );
}