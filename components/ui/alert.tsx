import type { ReactNode } from "react";

type AlertTone = "success" | "error" | "info";

const tones: Record<AlertTone, string> = {
  success: "border-brand-soft bg-brand-soft text-brand-dark",
  error: "border-danger/40 bg-white text-danger",
  info: "border-control-border bg-white text-foreground",
};

export function Alert({ tone, children }: { tone: AlertTone; children: ReactNode }) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`rounded-[10px] border px-3.5 py-2.5 text-sm ${tones[tone]}`}
    >
      {children}
    </div>
  );
}
