import Link from "next/link";
import type { ReactNode } from "react";

import type { CurrentUser } from "@/lib/auth/session";

type AppShellProps = {
  user: CurrentUser;
  title: string;
  activePath: string;
  children: ReactNode;
};

type SidebarItem = {
  href?: string;
  label: string;
};

function getSidebarItems(role: CurrentUser["role"]): SidebarItem[] {
  const items: SidebarItem[] = [
    { href: "/dashboard", label: "Beranda" },
    { href: "/profile", label: "Edit Profil" },
    { href: "/lowongan", label: "Lowongan Pekerjaan" },
  ];

  if (role === "jobseeker") {
    items.push({ href: "/dashboard/jobseeker/applications", label: "Lamaran Saya" });
  }

  if (role === "recruiter") {
    items.push(
      { href: "/jobs/new", label: "Buat Lowongan" },
      { href: "/dashboard/company/register", label: "Daftarkan Perusahaan" },
      { href: "/recruiter/applications", label: "Kelola Lamaran" },
    );
  }

  if (role === "admin") {
    items.push(
      { href: "/admin/users", label: "Kelola Pengguna" },
      { href: "/admin/companies", label: "Kelola Perusahaan" },
    );
  }

  items.push(
    { label: "Asesmen Karier" },
    { label: "Komunitas" },
    { label: "Mentorship" },
  );

  return items;
}

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
      className={
        active
          ? "block rounded-xl bg-[#dd1567] px-4 py-2.5 text-sm font-medium text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#dd1567]"
          : "block rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-[#dd1567]/10 hover:text-[#dd1567] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#dd1567]"
      }
    >
      {children}
    </Link>
  );
}

export function AppShell({ user, title, activePath, children }: AppShellProps) {
  const navItems = getSidebarItems(user.role);
  const clickableItems = navItems.filter(
    (item): item is { href: string; label: string } => Boolean(item.href),
  );

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-800">
      {/* SIDEBAR DESKTOP */}
      <aside className="hidden w-64 shrink-0 flex-col justify-between border-r border-slate-200 bg-white p-6 md:flex">
        <div>
          <Link
            href="/dashboard"
            aria-label="Beranda Kestara"
            className="mb-10 flex items-center gap-1.5 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#dd1567]"
          >
            <span className="text-3xl" aria-hidden="true">
              🧩
            </span>
            <span className="text-2xl font-extrabold tracking-tight text-slate-900">
              Kestara
            </span>
          </Link>

          <nav className="space-y-1" aria-label="Navigasi utama">
            {navItems.map((item) =>
              item.href ? (
                <NavigationLink
                  key={item.href}
                  href={item.href}
                  active={activePath === item.href}
                >
                  {item.label}
                </NavigationLink>
              ) : (
                <div
                  key={item.label}
                  title="Segera hadir"
                  className="cursor-not-allowed rounded-xl px-4 py-2.5 text-sm font-medium text-slate-400"
                >
                  {item.label}
                </div>
              ),
            )}
          </nav>
        </div>

        <form action="/auth/logout" method="post">
          <button
            type="submit"
            className="w-full cursor-pointer rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#dd1567]"
          >
            Keluar
          </button>
        </form>
      </aside>

      {/* KONTEN UTAMA */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Bar atas untuk layar kecil (sidebar disembunyikan) */}
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:hidden">
          <div className="flex min-w-0 items-center gap-2">
            <Link
              href="/dashboard"
              aria-label="Beranda Kestara"
              className="flex items-center gap-1.5"
            >
              <span className="text-2xl" aria-hidden="true">
                🧩
              </span>
              <span className="text-xl font-extrabold tracking-tight text-slate-900">
                Kestara
              </span>
            </Link>
            <span className="text-slate-300" aria-hidden="true">
              /
            </span>
            <span className="truncate text-xs font-semibold text-slate-600">{title}</span>
          </div>
          <form action="/auth/logout" method="post">
            <button
              type="submit"
              className="cursor-pointer rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#dd1567]"
            >
              Keluar
            </button>
          </form>
        </header>

        <div className="min-w-0 flex-1 pb-20 md:pb-0">{children}</div>

        {/* Navigasi bawah untuk layar kecil */}
        <nav
          className="fixed inset-x-0 bottom-0 z-40 flex min-h-16 items-center justify-around border-t border-slate-200 bg-white px-2 py-2 md:hidden"
          aria-label="Navigasi utama"
        >
          {clickableItems.slice(0, 4).map((item) => {
            const active = activePath === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={
                  active
                    ? "rounded-xl bg-[#dd1567] px-3 py-2 text-xs font-semibold text-white"
                    : "rounded-xl px-3 py-2 text-xs font-medium text-slate-600 hover:bg-[#dd1567]/10 hover:text-[#dd1567]"
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
