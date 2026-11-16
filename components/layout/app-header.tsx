import Link from "next/link";

import { LogoPlaceholder } from "@/components/brand/logo-placeholder";
import { roleLabel } from "@/lib/auth/roles";
import type { CurrentUser } from "@/lib/auth/session";

export function AppHeader({ user, title }: { user: CurrentUser; title: string }) {
  return (
    <header className="border-b border-line bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/" aria-label="Beranda Kestara">
            <LogoPlaceholder size={36} />
          </Link>
          <div className="hidden h-6 w-px bg-line sm:block" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">{title}</p>
            <p className="truncate text-xs text-muted">
              {user.fullName} · {roleLabel(user.role)}
            </p>
          </div>
        </div>
        <nav className="flex items-center gap-2 text-sm" aria-label="Navigasi akun">
          <Link
            href="/auth/logout"
            className="rounded-[10px] px-3 py-2 text-muted hover:bg-brand-soft hover:text-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            Keluar
          </Link>
        </nav>
      </div>
    </header>
  );
}
