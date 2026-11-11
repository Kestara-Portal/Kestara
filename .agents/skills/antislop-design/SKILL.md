---
name: antislop-design
description: Guidelines and design standards for creating clean, modern, bespoke UI in Kestara that avoids generic "AI-generated" looks (anti-slop). Use whenever designing or updating UI components, layouts, tables, and modals.
---

# Anti-Slop Modern UI Design System for Kestara

Tujuan skill ini adalah memastikan antarmuka (UI) Kestara terlihat profesional, modern, unik, dan tidak terasa seperti hasil generate AI yang kaku, generic, atau murahan (*anti-slop*).

## 1. Aturan Anti-Slop (Pantangan AI UI)

1. **JANGAN gunakan Emoji sebagai Icon Sistem:**
   - ❌ Hindari: `🏢`, `💼`, `⚠️`, `✅`, `❌`, `📍`, `💰`. Emojis terlihat tidak konsisten di berbagai OS (Android, iOS, Windows) dan memberi kesan template murah.
   - ✅ Gunakan: Clean inline vector SVG (Lucide / Heroicons style) dengan `stroke-width="1.75"` atau `"1.5"`, ukuran proporsional (16px–20px), dan warna token yang harmonis.

2. **JANGAN gunakan Layout Tabel Kaku & Standar:**
   - ❌ Hindari: Tabel kotak datar abu-abu tanpa depth, garis border tebal hitam/abu-abu pekat, dan teks polos berbaris tanpa hierarki.
   - ✅ Gunakan: Elevated card containers, hairline border (`border-slate-200/80` atau `border-[#E8F3F1]`), alternating subtle hover (`hover:bg-slate-50/70`), padding lega (`py-4.5 px-6`), dan metadata visual yang berstruktur (misal: logo/avatar + nama + link).

3. **JANGAN gunakan Alert Box Murahan:**
   - ❌ Hindari: Kotak merah/kuning pekat persegi dengan emoji peringatan di pojok.
   - ✅ Gunakan: Soft tinted cards dengan rounded corners (`rounded-xl` / `rounded-2xl`), border tipis beraksen warna lembut, icon dalam bulatan transparan ber-radius, dan micro-copy yang informatif.

4. **Hindari Komponen yang Terlalu Rapat atau Rata:**
   - Berikan ruang bernapas (*whitespace*).
   - Gunakan typography scale yang kontras: judul tebal dengan tracking ketat (`tracking-tight`), label caption uppercase kecil yang berjarak (`text-[11px] font-semibold tracking-wider text-slate-400`), dan tabular numbers untuk angka/statistik (`font-mono` atau `tabular-nums`).

---

## 2. Arah Visual Kestara (Green Teal Modern)

- **Brand Primary:** `#176B62` (Green Teal)
- **Primary Hover:** `#145A53`
- **Primary Soft / Surface:** `#E8F3F1`
- **Surface Background:** `#F8FAFC` atau `#F7FAF9`
- **Border Hairline:** `#E2E8F0` atau `#DCE6E3`
- **Danger Destructive:** `#DC2626` / `#B42318` dengan background `#FEF2F2`
- **Warning Amber:** `#D97706` dengan background `#FFFBEB`
- **Success Emerald:** `#059669` dengan background `#ECFDF5`

---

## 3. Komponen Polished yang Wajib Ada

1. **Toolbar & Filter:** Selalu sediakan Search Bar interaktif + Filter Pill ("Semua", "Aktif", "Dihapus") agar admin merasa memegang kendali atas data.
2. **Statistik Cepat (Metric Cards):** Card ringkas di atas tabel untuk rangkuman total mitra, lowongan aktif, dan status data.
3. **Modal Dialog yang Elegan:** Backdrop blur (`backdrop-blur-md bg-slate-900/40`), transisi halus, icon peringatan berbulatan lembut, dan tombol aksi destruktif yang tegas namun ramah pengguna.
4. **Toast / Notification Floating:** Banner notifikasi mengambang (floating) dengan animasi halus, bukan kotak teks statis biasa.
