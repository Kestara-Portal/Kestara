"use client";

import { useMemo, useState } from "react";

import type { AdminUserListItem } from "@/lib/auth/admin-actions";
import { UserStatusButton } from "./user-status-button";

interface DeactivateAccountsClientProps {
  users: AdminUserListItem[];
  currentUserId: string;
}

function roleLabel(role: string): string {
  switch (role) {
    case "jobseeker":
      return "Pencari Kerja";
    case "mentor":
      return "Mentor";
    case "recruiter":
      return "Rekruter";
    case "admin":
      return "Administrator";
    default:
      return role;
  }
}

function roleBadgeClass(role: string): string {
  switch (role) {
    case "admin":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "mentor":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "recruiter":
      return "bg-amber-100 text-amber-800 border-amber-200";
    default:
      return "bg-pink-50 text-[#dd1567] border-pink-200";
  }
}

function statusBadge(status: string) {
  if (status === "active") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Aktif
      </span>
    );
  }
  if (status === "suspended") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 border border-amber-200 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        Ditangguhkan
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 border border-red-200 px-2.5 py-0.5 text-xs font-semibold text-red-700">
      <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
      Dinonaktifkan
    </span>
  );
}

export function DeactivateAccountsClient({
  users,
  currentUserId,
}: DeactivateAccountsClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "deactivated">("all");

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchSearch =
        user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        roleLabel(user.role).toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus =
        statusFilter === "all" ? true : user.accountStatus === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [users, searchTerm, statusFilter]);

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama pengguna yang melanggar..."
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#dd1567] focus:outline-none focus:ring-2 focus:ring-[#dd1567]/20 transition"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-medium">Filter Status:</span>
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`rounded-lg px-3 py-1.5 font-semibold transition-all ${
              statusFilter === "all"
                ? "bg-[#dd1567] text-white shadow-xs"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
            }`}
          >
            Semua ({users.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("active")}
            className={`rounded-lg px-3 py-1.5 font-semibold transition-all ${
              statusFilter === "active"
                ? "bg-[#dd1567] text-white shadow-xs"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
            }`}
          >
            Aktif ({users.filter((u) => u.accountStatus === "active").length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("deactivated")}
            className={`rounded-lg px-3 py-1.5 font-semibold transition-all ${
              statusFilter === "deactivated"
                ? "bg-[#dd1567] text-white shadow-xs"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
            }`}
          >
            Dinonaktifkan ({users.filter((u) => u.accountStatus === "deactivated").length})
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        {filteredUsers.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-500">
            Tidak ada akun pengguna yang sesuai dengan pencarian.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th scope="col" className="px-6 py-3.5">
                    Nama Pengguna
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    Peran (Role)
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    Status Akun
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    Tanggal Terdaftar
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-right">
                    Tindakan Moderasi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((user) => {
                  const formattedDate = new Date(user.createdAt).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  });

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        {user.fullName}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block rounded-md border px-2.5 py-0.5 text-xs font-semibold ${roleBadgeClass(user.role)}`}
                        >
                          {roleLabel(user.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4">{statusBadge(user.accountStatus)}</td>
                      <td className="px-6 py-4 text-xs text-slate-500">{formattedDate}</td>
                      <td className="px-6 py-4 text-right">
                        <UserStatusButton
                          userId={user.id}
                          userName={user.fullName}
                          currentStatus={user.accountStatus}
                          isCurrentUser={currentUserId === user.id}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
