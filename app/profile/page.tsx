import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { PasswordModal } from "@/components/profile/password-modal";
import { PortfolioManager } from "@/components/profile/portfolio-manager";
import { ProfileForm } from "@/components/profile/profile-form";
import { SkillsManager } from "@/components/profile/skills-manager";
import { getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { PortfolioItemRow, UserSkillRow } from "@/types/database";

export const metadata: Metadata = {
  title: "Profil Saya",
};

// Auth-gated page reads the session cookie; opt out of Cache Components
// prerendering so the route is rendered dynamically per request.
export const instant = false;

interface ProfileRow {
  full_name: string;
  phone_number: string | null;
  bio: string | null;
}

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/login");
  }

  const supabase = await createClient();
  const [profileResult, skillsResult, portfolioResult] = await Promise.all([
    supabase
      .from("users")
      .select("full_name, phone_number, bio")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("user_skills")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("portfolio_items")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  if (
    profileResult.error ||
    !profileResult.data ||
    skillsResult.error ||
    portfolioResult.error
  ) {
    return (
      <AppShell user={user} title="Profil Saya" activePath="/profile">
        <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
          <div
            role="alert"
            className="rounded-[14px] border border-danger bg-white p-5"
          >
            <h1 className="text-lg font-semibold text-foreground">
              Profil belum dapat dimuat
            </h1>
            <p className="mt-2 text-sm text-muted">
              Data profil, keahlian, atau portofolio gagal dimuat. Coba muat ulang halaman.
            </p>
            <Link
              href="/profile"
              className="mt-4 inline-flex min-h-11 items-center rounded-[10px] text-sm font-medium text-brand underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              Muat ulang profil
            </Link>
          </div>
        </main>
      </AppShell>
    );
  }

  const profile = profileResult.data as ProfileRow | null;
  const skills = (skillsResult.data ?? []) as UserSkillRow[];
  const portfolio = (portfolioResult.data ?? []) as PortfolioItemRow[];
  const canManageProfessionalData = user.role !== "admin";

  return (
    <AppShell user={user} title="Profil Saya" activePath="/profile">
      <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Profil Saya</h1>
            <p className="mt-1 text-sm text-muted">
              Perbarui informasi profil, matriks keahlian, dan portofolio Anda.
            </p>
          </div>
          <PasswordModal />
        </div>

        <div className="space-y-8">
          <section aria-labelledby="profile-info-heading">
            <h2 id="profile-info-heading" className="mb-3 text-lg font-semibold text-foreground">
              Informasi profil
            </h2>
            <div className="rounded-[14px] border border-line bg-white p-5">
              <ProfileForm
                initial={{
                  fullName: profile?.full_name ?? user.fullName,
                  phoneNumber: profile?.phone_number ?? "",
                  bio: profile?.bio ?? "",
                }}
              />
            </div>
          </section>

          {canManageProfessionalData ? (
            <>
              <section aria-labelledby="skills-heading">
                <h2 id="skills-heading" className="mb-3 text-lg font-semibold text-foreground">
                  Matriks keahlian
                </h2>
                <SkillsManager skills={skills} />
              </section>

              <section aria-labelledby="portfolio-heading">
                <h2 id="portfolio-heading" className="mb-3 text-lg font-semibold text-foreground">
                  Portofolio
                </h2>
                <PortfolioManager items={portfolio} />
              </section>
            </>
          ) : (
            <p className="rounded-[14px] border border-line bg-brand-soft px-4 py-3 text-sm text-brand-dark">
              Administrator tidak memerlukan matriks keahlian atau portofolio profesional.
            </p>
          )}
        </div>
      </main>
    </AppShell>
  );
}
