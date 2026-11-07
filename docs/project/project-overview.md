# Kestara — Project Overview

> **Document status:** Draft  
> **Document owner:** Kestara project team  
> **Last reviewed:** 7 November 2026  
> **Purpose:** Ringkasan produk sebagai konteks bersama untuk anggota tim dan AI coding agents.

## 1. Ringkasan Produk

**Kestara** adalah platform pengembangan karier dan rekrutmen inklusif yang menghubungkan pengembangan kompetensi pengguna dengan kesempatan kerja. Kestara dirancang untuk mendukung proses pencarian kerja dan rekrutmen yang lebih berorientasi pada kompetensi, sekaligus memperhatikan privasi kandidat dan dukungan afirmatif.

Dua konsep pembeda yang menjadi perhatian utama proyek adalah:

- **Competency-based recruitment:** pencocokan dan penilaian kandidat perlu mempertimbangkan kompetensi yang relevan dengan kebutuhan pekerjaan.
- **Blind Profile / Blind Recruitment:** informasi identitas tertentu tidak ditampilkan kepada recruiter pada tahap screening awal sesuai aturan seleksi yang disepakati.

Dokumen ini merangkum arah produk yang sudah dibahas. Dokumen ini bukan pengganti laporan/proposal akademik, Jira, atau spesifikasi rinci setiap PBI.

## 2. Tujuan Produk

Tujuan produk yang menjadi dasar rancangan Kestara:

1. Menyediakan sarana bagi pengguna untuk mengelola akun dan profil profesional.
2. Mendukung pencarian dan pengelolaan lowongan pekerjaan.
3. Menyediakan akses ke materi micro-learning dan asesmen keterampilan.
4. Memfasilitasi interaksi antara pencari kerja dan mentor.
5. Menyediakan ruang diskusi komunitas.
6. Mendukung proses lamaran dan screening kandidat dengan pendekatan blind profile.
7. Mendukung proses rekrutmen yang memperhatikan kompetensi dan affirmative action.

Tujuan tersebut perlu dibaca bersama kebutuhan fungsional pada laporan/proposal dan Product Backlog yang dikelola melalui Jira.

## 3. Aktor dan Role

Kestara memiliki empat role aplikasi:

| Role teknis | Nama di UI | Tanggung jawab umum |
|---|---|---|
| `jobseeker` | Pencari Kerja | Mengelola profil, skill, portofolio, pembelajaran, dan lamaran. |
| `mentor` | Mentor | Mengelola profil profesional, skill, portofolio, serta aktivitas mentorship. |
| `recruiter` | Rekruter | Mengelola profil profesional, skill, portofolio, perusahaan/lowongan sesuai kewenangan, dan proses kandidat. |
| `admin` | Administrator | Mengelola dan memoderasi data/akun sesuai kewenangan administratif. |

### Aturan registrasi

- Registrasi publik ditujukan untuk Jobseeker, Mentor, dan Recruiter.
- Admin tidak boleh dipilih melalui form registrasi publik.
- Pembuatan atau pemberian role Admin harus melalui proses provisioning yang terkontrol.
- Pengguna tidak boleh menaikkan atau mengganti role sendiri melalui form profil atau metadata yang dapat dikendalikan pengguna.

Nama role teknis di atas adalah identifier kanonis. Label UI boleh menggunakan Bahasa Indonesia.

## 4. Modul Produk

Delapan modul utama yang diberikan dalam Product Backlog Kestara:

| No. | Modul / Epic | Ringkasan |
|---:|---|---|
| 1 | Kelola Akun & Profil Pengguna | Registrasi, melihat profil, memperbarui profil/skill/portofolio/password, dan pengelolaan status akun oleh Admin. |
| 2 | Kelola Lowongan Pekerjaan | Pembuatan, penayangan, pembaruan, dan penutupan/penghapusan lowongan. |
| 3 | Kelola Materi Micro-Learning | Pengelolaan materi pembelajaran oleh Admin dan akses pembelajaran oleh pengguna. |
| 4 | Kelola Data Mitra Perusahaan | Pendaftaran, penayangan, pembaruan, dan penghapusan data perusahaan. |
| 5 | Kelola Lamaran Pekerjaan & Blind Profile | Pengiriman dan pembatalan lamaran, screening kandidat dalam mode blind profile, dan pembaruan status lamaran. |
| 6 | Kelola Tes Keterampilan (Skill Assessment) | Pengelolaan bank soal/kategori tes dan akses serta hasil asesmen pengguna. |
| 7 | Kelola Jadwal & Sesi Mentorship | Pengajuan, peninjauan, pembaruan, dan pembatalan sesi mentorship. |
| 8 | Kelola Forum Diskusi Komunitas | Pembuatan, pembacaan, pembaruan, dan penghapusan topik/postingan forum. |

### Konvensi backlog Jira dari dosen

Tim mengikuti aturan dekomposisi berikut:

- **Satu modul = satu Epic.**
- **Create, Read, Update, dan Delete masing-masing merupakan PBI/User Story terpisah** di bawah Epic modul terkait.
- Task dan Sub-task digunakan untuk pekerjaan implementasi yang mendukung PBI.
- Bug digunakan untuk mencatat defect.

Jangan menggabungkan seluruh operasi CRUD menjadi satu PBI. Status, assignee, sprint, dan prioritas aktual tetap dikelola di Jira. Dokumen ini tidak menggantikan Jira.

## 5. Profil, Skills Matrix, dan Portfolio

Keputusan proyek yang sudah disepakati:

- Skills Matrix berlaku untuk Jobseeker, Mentor, dan Recruiter.
- Portfolio berlaku untuk Jobseeker, Mentor, dan Recruiter.
- Admin tidak diwajibkan memiliki Skills Matrix atau Portfolio profesional.

Rancangan data bersama seperti `user_skills` dan `portfolio_items` merupakan usulan implementasi agar data ketiga role tidak diduplikasi. Detail field, validasi, visibilitas, dan relasinya harus ditetapkan dalam database blueprint yang ditinjau sebelum implementasi.

## 6. Prinsip Produk

Prinsip berikut menjadi pedoman desain dan implementasi:

1. **Inklusif:** alur dan antarmuka harus dapat digunakan oleh beragam pengguna.
2. **Berorientasi kompetensi:** informasi keterampilan yang relevan perlu didukung dan ditampilkan sesuai kebutuhan proses.
3. **Privasi sejak desain:** data identitas dan dokumen sensitif tidak boleh terbuka secara default.
4. **Akses berbasis kewenangan:** setiap role hanya memperoleh akses yang diperlukan.
5. **Konsistensi:** antarmuka dan pola interaksi konsisten di seluruh role.
6. **Transparansi:** aturan matching, verifikasi, dan status proses harus dapat dijelaskan dan tidak boleh dibuat berdasarkan bobot yang dikarang.

## 7. Arah UI/UX dan Referensi

Warna utama yang disepakati:

- Green Teal: `#176B62`
- Arah visual: bersih, modern, responsif, dan mudah diakses.
- Referensi produk digunakan sebagai inspirasi pola pengalaman, bukan untuk menyalin identitas visual atau layout.

| Referensi | Inspirasi yang relevan |
|---|---|
| Glints | Job discovery dan rekomendasi pekerjaan |
| Duolingo | Guided learning dan motivasi progres |
| Jobstreet | Pencarian pekerjaan dan informasi perusahaan |
| LinkedIn | Komunitas profesional dan networking |
| Jobseeker | CV dan persiapan karier |

## 8. Arah Teknologi

### Kondisi repository pada snapshot yang pernah diaudit

Snapshot repository yang dibagikan sebelumnya menunjukkan teknologi berikut:

- Next.js 16.4.5
- React 19.3.0
- TypeScript 5.x
- Tailwind CSS 4.x
- NextAuth 4.24.15
- Prisma 5.22.0
- MySQL
- Model Prisma awal yang masih minimal

Kondisi ini adalah catatan snapshot audit, bukan jaminan kondisi branch lokal saat ini. Periksa source code dan `package.json` terbaru sebelum mengambil keputusan implementasi.

### Target teknologi yang dipilih tim

- Next.js, React, TypeScript, dan Tailwind CSS untuk aplikasi web.
- Supabase PostgreSQL sebagai database target.
- Supabase Auth untuk autentikasi target.
- Supabase Storage untuk file.
- Row Level Security (RLS) untuk pembatasan akses data.
- `@supabase/ssr` dan Supabase JS untuk integrasi Supabase dengan Next.js.
- SQL migrations sebagai sumber perubahan schema setelah migrasi Supabase dimulai.

**Pembedaan penting:** laporan/proposal menetapkan arah Three-Tier Architecture dan database relasional. Supabase adalah pilihan implementasi yang disepakati tim; jangan menyatakan bahwa laporan secara eksplisit menyebut Supabase jika tidak tertulis demikian.

Supabase project belum dibuat pada saat keputusan ini dicatat. Migrasi dari MySQL/Prisma/NextAuth masih merupakan pekerjaan yang direncanakan, bukan fitur yang sudah selesai.

## 9. Batasan dan Keputusan yang Belum Final

Jangan mengarang atau menetapkan sendiri hal-hal berikut:

- Formula dan bobot competency-based matching.
- Bobot atau mekanisme perhitungan affirmative action.
- Tahap persis dan otorisasi pembukaan identitas kandidat.
- Retensi dan penghapusan permanen data akun/lamaran.
- Proses verifikasi perusahaan dan kepemilikan recruiter.
- Detail field profil per role.
- Detail bank soal, penilaian, dan penerbitan sertifikat.
- Kebijakan visibilitas publik/private untuk tiap item portofolio.
- Kebutuhan tabel tambahan di luar ERD proposal.

Catat pertanyaan tersebut sebagai keputusan terbuka dan minta persetujuan pihak yang berwenang sebelum implementasi.

## 10. Sumber Kebenaran

Gunakan sumber berikut sesuai jenis informasinya:

1. Laporan/proposal dan ketentuan dosen: kebutuhan akademik, ruang lingkup, dan arsitektur yang diwajibkan.
2. Keputusan terbaru Project Owner/PM yang disetujui: pilihan implementasi tim.
3. Jira: status, assignee, prioritas, sprint, dan detail tiket aktif.
4. Dokumentasi berstatus Approved: kontrak teknis dan desain yang telah disetujui.
5. Source code dan hasil pengujian: kondisi implementasi aktual.

Jika sumber bertentangan, catat konflik dan minta keputusan. Jangan diam-diam mengubah requirement dosen atau menganggap rancangan sebagai implementasi.

---

**Status dokumen:** Draft. Tinjau terhadap laporan/proposal lengkap dan persetujuan tim sebelum mengubah status menjadi Approved.
