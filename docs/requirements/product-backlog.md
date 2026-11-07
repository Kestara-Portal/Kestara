# Kestara — Product Backlog Structure (Jira)

> **Status:** Draft mapping based on the eight module descriptions supplied by the Project Owner.  
> **Jira issue keys:** Not assigned here. Use the actual keys from the existing Jira board.  
> **Lecturer's decomposition rule:** One module = one Epic; Create, Read, Update, Delete are four separate PBI/User Stories.

## 1. Jira Hierarchy

```text
Project: Kestara
  Epic E01 — Kelola Akun & Profil Pengguna
    PBI: Create
    PBI: Read
    PBI: Update
    PBI: Delete
  Epic E02 — Kelola Lowongan Pekerjaan
    PBI: Create
    PBI: Read
    PBI: Update
    PBI: Delete
  ... continue through E08
```

The labels E01–E08 and PBI references below are documentation identifiers only, not actual Jira keys. Do not create duplicate Jira issues if equivalent issues already exist. Map these references to existing Jira tickets.

## 2. Backlog Summary

| Epic ref | Module | PBI count |
|---|---|---:|
| E01 | Kelola Akun & Profil Pengguna | 4 |
| E02 | Kelola Lowongan Pekerjaan | 4 |
| E03 | Kelola Materi Micro-Learning | 4 |
| E04 | Kelola Data Mitra Perusahaan | 4 |
| E05 | Kelola Lamaran Pekerjaan & Blind Profile | 4 |
| E06 | Kelola Tes Keterampilan (Skill Assessment) | 4 |
| E07 | Kelola Jadwal & Sesi Mentorship | 4 |
| E08 | Kelola Forum Diskusi Komunitas | 4 |
| **Total** | **8 Epic** | **32 PBI** |

## 3. Epic and PBI Mapping


### E01 — Kelola Akun & Profil Pengguna

#### E01-C — Create

- **Actor:** Jobseeker, Mentor, Recruiter
- **User story / requirement:** Pengguna (Pencari Kerja, Mentor, Rekruter) dapat membuat akun dan mengisi data profil baru di dalam sistem.
- **Acceptance criteria:** See `E01-C` in `acceptance-criteria.md`.
- **Jira mapping:** Add the actual existing issue key after checking the Jira board.

#### E01-R — Read

- **Actor:** Pengguna terautentikasi
- **User story / requirement:** Pengguna dapat melihat detail informasi profil mereka sendiri pada halaman dashboard.
- **Acceptance criteria:** See `E01-R` in `acceptance-criteria.md`.
- **Jira mapping:** Add the actual existing issue key after checking the Jira board.

#### E01-U — Update

- **Actor:** Jobseeker, Mentor, Recruiter
- **User story / requirement:** Pengguna dapat memperbarui dan mengedit matriks keahlian, portofolio, atau kata sandi mereka.
- **Acceptance criteria:** See `E01-U` in `acceptance-criteria.md`.
- **Jira mapping:** Add the actual existing issue key after checking the Jira board.

#### E01-D — Delete

- **Actor:** Admin
- **User story / requirement:** Administrator memiliki hak akses untuk menghapus atau menonaktifkan akun pengguna yang melanggar ketentuan.
- **Acceptance criteria:** See `E01-D` in `acceptance-criteria.md`.
- **Jira mapping:** Add the actual existing issue key after checking the Jira board.


### E02 — Kelola Lowongan Pekerjaan

#### E02-C — Create

- **Actor:** Recruiter/mitra perusahaan terotorisasi
- **User story / requirement:** Mitra Perusahaan atau Rekruter dapat membuat dan mempublikasikan lowongan kerja baru beserta kriteria keahliannya.
- **Acceptance criteria:** See `E02-C` in `acceptance-criteria.md`.
- **Jira mapping:** Add the actual existing issue key after checking the Jira board.

#### E02-R — Read

- **Actor:** Jobseeker
- **User story / requirement:** Pencari kerja dapat melihat daftar lowongan pekerjaan yang tersedia di job portal Kestara.
- **Acceptance criteria:** See `E02-R` in `acceptance-criteria.md`.
- **Jira mapping:** Add the actual existing issue key after checking the Jira board.

#### E02-U — Update

- **Actor:** Recruiter terotorisasi
- **User story / requirement:** Rekruter dapat mengubah atau memperbarui detail, kualifikasi, atau deskripsi lowongan kerja.
- **Acceptance criteria:** See `E02-U` in `acceptance-criteria.md`.
- **Jira mapping:** Add the actual existing issue key after checking the Jira board.

#### E02-D — Delete

- **Actor:** Recruiter terotorisasi, Admin
- **User story / requirement:** Rekruter atau Administrator dapat menghapus maupun menutup lowongan pekerjaan yang sudah tidak aktif.
- **Acceptance criteria:** See `E02-D` in `acceptance-criteria.md`.
- **Jira mapping:** Add the actual existing issue key after checking the Jira board.


### E03 — Kelola Materi Micro-Learning

#### E03-C — Create

- **Actor:** Admin
- **User story / requirement:** Administrator dapat menambahkan materi pelatihan atau konten pembelajaran mikro yang baru ke dalam sistem.
- **Acceptance criteria:** See `E03-C` in `acceptance-criteria.md`.
- **Jira mapping:** Add the actual existing issue key after checking the Jira board.

#### E03-R — Read

- **Actor:** Jobseeker
- **User story / requirement:** Pencari kerja dapat membaca, menonton, atau mengakses materi pelatihan yang tersedia.
- **Acceptance criteria:** See `E03-R` in `acceptance-criteria.md`.
- **Jira mapping:** Add the actual existing issue key after checking the Jira board.

#### E03-U — Update

- **Actor:** Admin
- **User story / requirement:** Administrator dapat memperbarui isi teks, tautan materi, atau status progres dari modul pembelajaran.
- **Acceptance criteria:** See `E03-U` in `acceptance-criteria.md`.
- **Jira mapping:** Add the actual existing issue key after checking the Jira board.

#### E03-D — Delete

- **Actor:** Admin
- **User story / requirement:** Administrator berhak menghapus modul pembelajaran yang sudah kedaluwarsa atau tidak lagi relevan.
- **Acceptance criteria:** See `E03-D` in `acceptance-criteria.md`.
- **Jira mapping:** Add the actual existing issue key after checking the Jira board.


### E04 — Kelola Data Mitra Perusahaan

#### E04-C — Create

- **Actor:** Admin, Recruiter
- **User story / requirement:** Administrator atau Rekruter dapat mendaftarkan profil perusahaan baru ke dalam basis data Kestara.
- **Acceptance criteria:** See `E04-C` in `acceptance-criteria.md`.
- **Jira mapping:** Add the actual existing issue key after checking the Jira board.

#### E04-R — Read

- **Actor:** Jobseeker
- **User story / requirement:** Sistem menampilkan informasi detail tentang perusahaan saat pencari kerja meninjau suatu lowongan.
- **Acceptance criteria:** See `E04-R` in `acceptance-criteria.md`.
- **Jira mapping:** Add the actual existing issue key after checking the Jira board.

#### E04-U — Update

- **Actor:** Recruiter terotorisasi
- **User story / requirement:** Rekruter dapat memperbarui informasi, deskripsi, atau alamat situs web perusahaannya.
- **Acceptance criteria:** See `E04-U` in `acceptance-criteria.md`.
- **Jira mapping:** Add the actual existing issue key after checking the Jira board.

#### E04-D — Delete

- **Actor:** Admin
- **User story / requirement:** Administrator dapat menghapus entitas perusahaan jika terjadi duplikasi atau perusahaan tersebut tidak lagi bermitra.
- **Acceptance criteria:** See `E04-D` in `acceptance-criteria.md`.
- **Jira mapping:** Add the actual existing issue key after checking the Jira board.


### E05 — Kelola Lamaran Pekerjaan & Blind Profile

#### E05-C — Create

- **Actor:** Jobseeker
- **User story / requirement:** Pencari kerja dapat mengirimkan lamaran ke lowongan pekerjaan yang diinginkan.
- **Acceptance criteria:** See `E05-C` in `acceptance-criteria.md`.
- **Jira mapping:** Add the actual existing issue key after checking the Jira board.

#### E05-R — Read

- **Actor:** Recruiter terotorisasi
- **User story / requirement:** Rekruter dapat melihat profil kandidat pelamar dalam mode yang tersamar (Blind Profile) serta skor kecocokannya.
- **Acceptance criteria:** See `E05-R` in `acceptance-criteria.md`.
- **Jira mapping:** Add the actual existing issue key after checking the Jira board.

#### E05-U — Update

- **Actor:** Recruiter terotorisasi
- **User story / requirement:** Rekruter dapat memperbarui status lamaran (misalnya dari tahap seleksi menjadi lolos wawancara).
- **Acceptance criteria:** See `E05-U` in `acceptance-criteria.md`.
- **Jira mapping:** Add the actual existing issue key after checking the Jira board.

#### E05-D — Delete

- **Actor:** Jobseeker pemilik lamaran
- **User story / requirement:** Pencari kerja dapat membatalkan atau menghapus berkas lamaran yang telah mereka kirimkan.
- **Acceptance criteria:** See `E05-D` in `acceptance-criteria.md`.
- **Jira mapping:** Add the actual existing issue key after checking the Jira board.


### E06 — Kelola Tes Keterampilan (Skill Assessment)

#### E06-C — Create

- **Actor:** Admin
- **User story / requirement:** Administrator dapat membuat daftar bank soal atau kategori tes kompetensi baru ke dalam sistem.
- **Acceptance criteria:** See `E06-C` in `acceptance-criteria.md`.
- **Jira mapping:** Add the actual existing issue key after checking the Jira board.

#### E06-R — Read

- **Actor:** Jobseeker
- **User story / requirement:** Pencari kerja dapat melihat dan membaca pertanyaan asesmen kompetensi yang diujikan.
- **Acceptance criteria:** See `E06-R` in `acceptance-criteria.md`.
- **Jira mapping:** Add the actual existing issue key after checking the Jira board.

#### E06-U — Update

- **Actor:** Admin; sistem memproses hasil
- **User story / requirement:** Administrator dapat memperbarui deskripsi tes keterampilan, dan sistem memperbarui skor atau sertifikat hasil asesmen pencari kerja.
- **Acceptance criteria:** See `E06-U` in `acceptance-criteria.md`.
- **Jira mapping:** Add the actual existing issue key after checking the Jira board.

#### E06-D — Delete

- **Actor:** Admin
- **User story / requirement:** Administrator dapat menghapus tes kompetensi yang tidak lagi diperlukan dari basis data sistem.
- **Acceptance criteria:** See `E06-D` in `acceptance-criteria.md`.
- **Jira mapping:** Add the actual existing issue key after checking the Jira board.


### E07 — Kelola Jadwal & Sesi Mentorship

#### E07-C — Create

- **Actor:** Jobseeker
- **User story / requirement:** Pencari kerja dapat mengajukan permintaan jadwal bimbingan karir (sesi mentorship) kepada mentor.
- **Acceptance criteria:** See `E07-C` in `acceptance-criteria.md`.
- **Jira mapping:** Add the actual existing issue key after checking the Jira board.

#### E07-R — Read

- **Actor:** Mentor dan Jobseeker
- **User story / requirement:** Mentor dan pencari kerja dapat melihat daftar jadwal konsultasi serta membaca pesan di forum.
- **Acceptance criteria:** See `E07-R` in `acceptance-criteria.md`.
- **Jira mapping:** Add the actual existing issue key after checking the Jira board.

#### E07-U — Update

- **Actor:** Mentor terkait
- **User story / requirement:** Mentor dapat memperbarui ketersediaan jadwal, mengubah status persetujuan sesi mentorship, atau menambah catatan.
- **Acceptance criteria:** See `E07-U` in `acceptance-criteria.md`.
- **Jira mapping:** Add the actual existing issue key after checking the Jira board.

#### E07-D — Delete

- **Actor:** Mentor terkait atau Jobseeker pemohon
- **User story / requirement:** Mentor atau pencari kerja dapat membatalkan atau menghapus jadwal sesi bimbingan yang telah direncanakan.
- **Acceptance criteria:** See `E07-D` in `acceptance-criteria.md`.
- **Jira mapping:** Add the actual existing issue key after checking the Jira board.


### E08 — Kelola Forum Diskusi Komunitas

#### E08-C — Create

- **Actor:** Pengguna terautentikasi
- **User story / requirement:** Pengguna dapat membuat topik diskusi atau postingan baru di dalam wadah komunitas.
- **Acceptance criteria:** See `E08-C` in `acceptance-criteria.md`.
- **Jira mapping:** Add the actual existing issue key after checking the Jira board.

#### E08-R — Read

- **Actor:** Pengguna sesuai visibilitas forum
- **User story / requirement:** Pengguna dapat membaca percakapan, topik diskusi, dan balasan antar-pengguna di forum.
- **Acceptance criteria:** See `E08-R` in `acceptance-criteria.md`.
- **Jira mapping:** Add the actual existing issue key after checking the Jira board.

#### E08-U — Update

- **Actor:** Penulis
- **User story / requirement:** Pengguna dapat mengedit isi pesan atau postingan diskusi yang telah mereka buat.
- **Acceptance criteria:** See `E08-U` in `acceptance-criteria.md`.
- **Jira mapping:** Add the actual existing issue key after checking the Jira board.

#### E08-D — Delete

- **Actor:** Admin atau penulis
- **User story / requirement:** Administrator atau pembuat postingan dapat menghapus postingan yang tidak sesuai aturan.
- **Acceptance criteria:** See `E08-D` in `acceptance-criteria.md`.
- **Jira mapping:** Add the actual existing issue key after checking the Jira board.

## 4. Jira Issue Writing Convention

Recommended PBI title:

`[E01-C] Create account and initial user profile`

Recommended description:

- User story: As a [role], I want [capability], so that [value].
- Context: reference the approved functional requirement.
- Acceptance criteria: use Given/When/Then or a numbered testable list.
- Dependencies: identify other PBI, API, database, or design dependencies.
- Out of scope: list behavior not approved for this PBI.
- Test evidence: link PR, test report, or screenshots as appropriate.

## 5. Work Item Types

- **Epic:** one product module.
- **PBI / User Story:** one CRUD operation for the module, following lecturer instruction.
- **Task:** implementation work that supports a PBI (UI, API, schema, docs, etc.).
- **Sub-task:** smaller work item owned by an individual.
- **Bug:** defect against expected behavior.
- **Spike:** time-boxed research where implementation details are unknown.

Do not turn every code file into a PBI. Tasks and sub-tasks are implementation breakdowns under the relevant PBI.

## 6. Clarifications Required Before Acceptance

1. E03-U: clarify whether Admin edits learning module publication/progress metadata or an individual learner's progress.
2. E04-C/U: define Recruiter-company authorization and verification.
3. E05-R: approve Blind Profile field allowlist, matching score formula, and identity reveal stage.
4. E05-D: define whether a submitted application is cancelled, soft-deleted, or physically deleted; define document handling.
5. E06-R/U: define question types, answer-key protection, scoring, retakes, and certificate rules.
6. E07-R: clarify whether "messages in the forum" refers to mentorship-session messages or the separate community forum.
7. All Delete PBI: define soft deletion, deactivation, archival, and retention behavior per entity.

## 7. Jira Governance

- Jira is the source of truth for status, assignee, sprint, priority, and due dates.
- Update documentation when approved scope or acceptance criteria change.
- Do not copy transient Jira status into static docs unless the snapshot date is stated.
- Confirm the PM's workflow and existing issue types before changing the board configuration.
