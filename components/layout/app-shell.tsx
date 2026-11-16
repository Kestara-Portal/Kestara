import Link from "next/link";
import type { ReactNode } from "react";

import { AppHeader } from "@/components/layout/app-header";
import { LogoPlaceholder } from "@/components/brand/logo-placeholder";
import type { CurrentUser } from "@/lib/auth/session";

type AppShellProps = {
  user: CurrentUser;
  title: string;
  activePath: "/profile" | "/jobs/new";
  children: ReactNode;
};

function NavigationLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={[
        "flex min-h-11 items-center rounded-[10px] px-3 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
        active
          ? "bg-brand-soft text-brand-dark"
          : "text-muted hover:bg-brand-soft hover:text-brand",
      ].join(" ")}
    >
      {children}
    </Link>
  );
}

export function AppShell({ user, title, activePath, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 border-r border-line bg-white px-4 py-6 lg:flex lg:flex-col">
          <Link href="/" aria-label="Beranda Kestara" className="mx-2">
            <LogoPlaceholder size={40} />
          </Link>
          <nav className="mt-8 space-y-2" aria-label="Navigasi utama">
            <NavigationLink href="/profile" active={activePath === "/profile"}>
              Profil
            </NavigationLink>
            {user.role === "recruiter" ? (
              <NavigationLink href="/jobs/new" active={activePath === "/jobs/new"}>
                Buat lowongan
              </NavigationLink>
            ) : null}
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <AppHeader user={user} title={title} />
          <div className="min-w-0 flex-1 pb-20 lg:pb-0">{children}</div>
          <nav
            className="fixed inset-x-0 bottom-0 z-40 flex min-h-16 items-center justify-around border-t border-line bg-white px-3 py-2 lg:hidden"
            aria-label="Navigasi utama"
          >
            <NavigationLink href="/profile" active={activePath === "/profile"}>
              Profil
            </NavigationLink>
            {user.role === "recruiter" ? (
              <NavigationLink href="/jobs/new" active={activePath === "/jobs/new"}>
                Buat lowongan
              </NavigationLink>
            ) : null}
          </nav>
        </div>
      </div>
    </div>
  );
}
