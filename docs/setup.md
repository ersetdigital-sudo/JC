# Setup JC Apparel dari nol

Panduan ini untuk instalasi baru: project Supabase, Cloudinary, dan Vercel
milik JC Apparel sendiri. Semua langkah berurutan — jangan loncat.

---

## 0. Yang sudah siap

| Service | Status |
| --- | --- |
| **Supabase** | ✅ Project **JC APPAREL** sudah dibuat — ref `jvdqphlwulgtssxgpebq`, region `ap-southeast-2` (Sydney), URL `https://jvdqphlwulgtssxgpebq.supabase.co`. Migrasi `0001`–`0012` sudah dijalankan dan tercatat di `public.supabase_migrations`. Signup Auth sudah dimatikan. |
| **Cloudinary** | ✅ Akun **`rzwe62ed`** — preset `ml_default` sudah disetel **signed**, folder `jc-apparel/desain`, format jpg/png/webp, batas 10 MB. Sudah diuji end-to-end (upload signed jalan, tanpa signature ditolak, aset mendarat di folder yang benar). |
| **Vercel** | ✅ **LIVE** di **https://jc-apparel.vercel.app** — project `jc-apparel`, linked ke repo `ersetdigital-sudo/JC` branch `main`, auto-deploy aktif. 14 env var terpasang (production + preview + development). |
| **Fonnte** | ⬜ Belum — token device, diisi dari dashboard → Pengaturan → WhatsApp |

> ### ⚠️ `NEXT_PUBLIC_*` di-inline saat build
>
> Next.js **mengganti `process.env.NEXT_PUBLIC_*` dengan nilainya secara literal
> saat build** — bukan saat runtime. Kalau env var-nya berubah **setelah** build,
> bundle masih memakai nilai lama dan aplikasinyaDiam-diam jatuh ke data
> fallback (`lib/data.ts`) tanpa error yang mencolok.
>
> Di Vercel ini aman: build dan run terjadi di environment yang sama, jadi
> nilainya sama. **Tapi di lokal**, kalau kamu ganti `.env.local`, kamu wajib
> `pnpm build` ulang sebelum `pnpm start` — `pnpm dev` tidak punya masalah ini
> karena tidak ada bundling.

---

## 1. Project Supabase

1. Buat project baru di [supabase.com](https://supabase.com) (pilih region terdekat).
2. **Database → Settings → API** (di dashboard versi baru: **Project Settings → API**).
   Ambil tiga nilai ini:

   | Nilai | Dipakai untuk | Boleh dibuka browser? |
   | --- | --- | --- |
   | Project URL | `NEXT_PUBLIC_SUPABASE_URL` | Ya |
   | `anon` / `publishable` key | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Ya |
   | `service_role` key | `SUPABASE_SERVICE_ROLE_KEY` | **Tidak** |

   > `service_role` key melewati seluruh policy RLS. Jangan pernah ditaruh di
   > repo, di `NEXT_PUBLIC_*`, atau di frontend.

3. **Daftar akun (Auth)**: tidak perlu membuat user apa pun. Dashboard admin
   pakai shared password (`PESANAN_PASSWORD`), bukan Supabase Auth. Pastikan
   signup user dinonaktifkan di **Authentication → Providers → Email**.

---

## 2. Migrasi database

Buka **SQL Editor** di dashboard Supabase, lalu jalankan file-file ini **berurutan**
satu per satu (-copy paste isi file, klik Run):

```
supabase/migrations/0001_baseline_schema.sql
supabase/migrations/0002_baseline_functions.sql
supabase/migrations/0003_baseline_seed.sql
supabase/migrations/0004_perbaiki_notifikasi_tahap.sql
supabase/migrations/0005_rapikan_akses_warisan.sql
supabase/migrations/0006_selaraskan_nama_tahap.sql
supabase/migrations/0007_nomor_wa_resmi.sql
supabase/migrations/0008_ulang_kirim_notif_gagal.sql
supabase/migrations/0009_brand_vsp_sport.sql
supabase/migrations/0010_brand_taff_sportwear.sql
supabase/migrations/0011_ganti_logo_brand.sql
supabase/migrations/0012_brand_jc_apparel.sql   ← rebrand ke JC Apparel
```

> Database **baru** = jalankan semuanya dari `0001`. Jangan pakai `0001`–`0003`
> kalau kamu menyalin database lama — untuk itu cukup `0004` ke atas.

`0003` mengisi baris `brand` dengan "MENARA", lalu `0009` → `0010` → `0011` →
`0012` menimpanya sampai "JC Apparel". Jadi **jangan berhenti di `0003`**.

### Verifikasi

```sql
-- Harus 1 baris: JC Apparel / JC / /brand-logo-jc.png
select id, name, monogram, logo_path from public.brand where id = 1;

-- Harus 11 baris (tahap jersey)
select count(*) from public.production_steps;

-- Harus 6 baris (tahap maklon)
select count(*) from public.maklon_steps;

-- Harus 11 tabel
select count(*) from information_schema.tables
  where table_schema = 'public' and table_type = 'BASE TABLE';

-- Anon boleh baca brand (dibutuhkan halaman publik)
select name, monogram from public.brand;  -- via anon key, bukan service role
```

---

## 3. Environment variables

Salin `.env.local.example` jadi `.env.local` lalu isi:

```bash
cp .env.local.example .env.local
```

| Variabel | Wajib | Cara dapat |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | ya | Project URL dari Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ya | Anon key dari Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | ya | Service role key dari Supabase |
| `SETTINGS_ENCRYPTION_KEY` | ya | `openssl rand -base64 32` |
| `TRACK_SESSION_SECRET` | ya | `openssl rand -hex 32` |
| `PESANAN_PASSWORD` | ya | Password dashboard, pilihanmu sendiri |
| `CRON_SECRET` | ya | `openssl rand -hex 32` |
| `CLOUDINARY_CLOUD_NAME` | ya | Cloudinary dashboard |
| `CLOUDINARY_API_KEY` | ya | Cloudinary dashboard |
| `CLOUDINARY_API_SECRET` | ya | Cloudinary dashboard |
| `CLOUDINARY_UPLOAD_PRESET` | ya | Cloudinary dashboard |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | ya | Sama dengan `CLOUDINARY_CLOUD_NAME` |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | ya | Sama dengan `CLOUDINARY_UPLOAD_PRESET` |
| `APP_URL` | ya | Domain produksi (`http://localhost:3000` untuk dev) |

Tanpa Windows (PowerShell):

```powershell
# 4 secret wajib — generate sekali, simpan di password manager
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

> **`TRACK_SESSION_SECRET` tidak boleh diganti setelah produksi.** Nilai ini
> menandatangani token HMAC di link tracking. Kalau berubah, semua link yang
> sudah dikirim ke customer langsung mati.
>
> **`SETTINGS_ENCRYPTION_KEY` juga tidak boleh diganti** — token Fonnte
> disimpan terenkripsi dengannya.

---

## 4. Cloudinary

Cloudinary menyimpan foto desain dan foto work order (WO).

### 4.1 Buat akun & ambil kredensial

1. Buat account di [cloudinary.com](https://cloudinary.com).
2. **Settings → API Keys** (atau dashboard overview) — salin:
   - **Cloud name**
   - **API key**
   - **API secret**  ← jangan pernah masuk repo / `NEXT_PUBLIC_*`

### 4.2 Upload preset

> **Status: sudah dibuat.** Preset `ml_default` di akun `rzwe62ed` sudah
> disetel signed + folder yang benar, dan sudah diuji end-to-end. Kalau kamu
> bikin preset baru, samakan setting-nya dengan tabel di bawah.

**Settings → Upload → Upload presets → Add upload preset**:

| Setting | Isi | Kenapa |
| --- | --- | --- |
| **Preset name** | `ml_default` | Harus sama persis dengan `CLOUDINARY_UPLOAD_PRESET` |
| **Signing mode** | **Signed** | **Wajib.** Kalau *Unsigned*, siapa pun yang baca cloud name dari source halaman bisa upload ke akunmu tanpa izin |
| **Folder** | `jc-apparel/desain` | Harus sama dengan `CLOUDINARY_FOLDER` di `lib/cloudinary.ts` |
| **Allowed formats** | `jpg, jpeg, png, webp` | Sesuai `ALLOWED_IMAGE_TYPES` di `lib/cloudinary.ts` |
| **Maximum file size** | `10485760` (10 MB) | Sama dengan `MAX_IMAGE_BYTES` di `lib/cloudinary.ts` |
| **Access control / Access mode** | **Public** (default) | Foto desain ditampilkan ke customer lewat halaman tracking |
| **Transformation settings** | **kosongkan** | Transformasi `f_auto,q_auto,w_N` sudah diterapkan saat delivery lewat URL — eager transform di preset cuma menambah tagihan |

> **Soal "Restricted access".** Kalau kamu mengaktifkan *Restrict access* di
> preset, folder yang diizinkan **harus** memuat `jc-apparel/desain`. Kalau tidak,
> upload ditolak dengan "folder not allowed" — gejalanya operator cuma lihat
> "Upload gagal".
>
> **Soal batas ukuran.** Ada dua batas, dan bedanya penting:
> - `MAX_IMAGE_BYTES` = **10 MB** — file apa yang boleh dipilih operator.
> - `MAX_UPLOAD_BYTES` = **2 MB** — ukuran yang benar-benar **dikirim** ke
>   Cloudinary, setelah foto dikecilkan di browser (maks 1600px, WebP q0.82).
>
> Batas 2 MB itu bukan sekadar POLICY — itu penghematan kredit. Foto asli 6 MB
> dari HP jadi ~200-400 KB di Cloudinary. Kalau downscale gagal (browser nggak
> bisa decode), file ASLI yang dikirim, dan app menolak dengan pesan jelas
> daripada mengirim blob 6 MB. Batas 10 MB di preset Cloudinary cuma
> penjaga cadangan, supaya Cloudinary nggak menolak file yang memang sah.

### 4.3 Env var

Isi **enam** variabel ini — dua pasang di antaranya harus bernilai sama:

```
CLOUDINARY_CLOUD_NAME          = rzwe62ed
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = rzwe62ed              ← sama

CLOUDINARY_UPLOAD_PRESET       = ml_default
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET = ml_default         ← sama

CLOUDINARY_API_KEY             = <api key>
CLOUDINARY_API_SECRET          = <api secret>
```

`NEXT_PUBLIC_*` dipakai browser (nama cloud & preset memang kelihatan di
public — itu normal, yang dirahasiakan API secret). `CLOUDINARY_API_KEY` /
`CLOUDINARY_API_SECRET` hanya dipakai server untuk menandatangani upload dan
menghapus aset.

### 4.4 Verifikasi

1. Deploy / jalankan app dengan env var di atas.
2. Login ke dashboard → **Pesanan → Tambah pesanan** → unggah foto desain.
3. Foto harus muncul, dan URL-nya diawali:
   `https://res.cloudinary.com/<cloud-name>/image/upload/...`
4. Cek di [Cloudinary → Media Library](https://cloudinary.com/console/media_library)
   → folder `jc-apparel/desain` → filenya ada.

Kalau upload gagal:
- **"Signing mode" bukan Signed** → presetnya salah setelan.
- **"Folder not allowed"** → preset Restrict access tidak mengizinkan
  `jc-apparel/desain`.
- **"Server belum dikonfigurasi"** → `CLOUDINARY_API_SECRET` belum di-set.

> **Catatan (bukan bagian setup, tapi perlu diketahui):** foto work order
> (`wo_photos`, admin-only) dan foto desain (customer-facing) memakai **preset
> dan folder yang sama**, jadi keduanya punya delivery publik. URL-nya hanya
> disimpan di database dan tidak pernah ditampilkan ke customer, tapi kalau
> mau memisahkannya, jalurnya: dua preset + dua folder, dan `CLOUDINARY_FOLDER`
> di `lib/cloudinary.ts` jadi dua konstanta (`CLOUDINARY_FOLDER_PUBLIC` dan
> `CLOUDINARY_FOLDER_PRIVATE`). Itu perubahan di luar cakupan rebrand — bilang
> aja kalau mau dikerjakan.

---

## 5. Vercel

1. Import repo ini ke Vercel (Framework: Next.js, otomatis terdeteksi).
2. **Settings → Environment Variables** — isi **semua** variabel di tabel
   tadi, untuk **Production** dan **Preview**.
3. `APP_URL` = domain produksi kamu, mis. `https://jcapparel.id`.
   Domain ini yang dipakai membangun link tracking yang dikirim ke customer.
4. Deploy.

### Cron pengingat deadline

`vercel.json` tidak memuat blok `crons` — pengingat deadline dijalankan dari
[cron-job.org](https://cron-job.org):

| Field | Isi |
| --- | --- |
| URL | `https://jc-apparel.vercel.app/api/admin/deadline-notif` |
| Header | `Authorization: Bearer <CRON_SECRET>` |
| Timezone | `Asia/Jakarta` |
| Schedule | Every hour |

Per jam, bukan sekali sehari — panel admin mengizinkan operator memilih
"Jam Kirim (WIB)" mana saja, jadi route yang memutuskan apakah sudah waktunya
kirim, bukan jadwalnya.

---

## 6. Token Fonnte (WhatsApp)

Di dalam dashboard admin: **Pengaturan → WhatsApp** → isi token Fonnte → Simpan.
Token disimpan terenkripsi (AES-256-GCM) dengan `SETTINGS_ENCRYPTION_KEY`, jadi
tidak pernah menyentuh repo atau halaman.

> Ganti `CLOUDINARY_FOLDER` di `lib/cloudinary.ts` kalau kamu pakai folder
> Cloudinary yang berbeda.

---

## 7. Data contoh (opsional)

Dua seeder tersedia kalau mau ada data untuk klik-klik:

```bash
node scripts/seed-pesanan-demo.mjs   # pesanan jersey + riwayat tahap
node scripts/seed-maklon-demo.mjs    # pesanan maklon
```

Keduanya hanya menulis baris bernama "Demo …" dan menerima `--clean` untuk
menghapus tepat baris itu saja.

---

## 8. Logo

Logo di `public/` masih placeholder. Ganti dengan logo JC Apparel asli —
lihat [`brand-assets.md`](brand-assets.md) untuk nama berkas, cara menukar,
dan catatan cache (`immutable` 1 tahun, jadi nama file sebaiknya baru).

---

## Checklist sebelum production

- [x] Migrasi `0001`–`0012` jalan tanpa error, tercatat di `public.supabase_migrations`
- [x] `select name, monogram from public.brand` → `JC Apparel` / `JC`
- [x] 11 tabel terbentuk, 11 tahap jersey + 6 tahap maklon
- [x] Signup Supabase Auth dimatikan (`disable_signup = true`)
- [x] RLS diuji: anon hanya bisa baca `brand` + daftar tahap; 8 tabel operasional 0 baris bocor; insert anon → 401
- [x] Upload preset Cloudinary `ml_default` mode **Signed**, folder `jc-apparel/desain`, batas 10 MB
- [x] Cloudinary diuji end-to-end: signed upload → 200, tanpa signature → 400, signature salah → 401, format terlarang → 400, >10 MB → 400, aset mendarat di folder yang benar
- [x] `tsc --noEmit` dan `next build` bersih
- [x] Deploy produksi live di https://jc-apparel.vercel.app, auto-deploy dari `main` aktif
- [x] Uji produksi: 5 halaman publik 200, login 200 / password salah 401, dashboard admin 200, upload Cloudinary signed 200, 4 endpoint tanpa kredensial → 401
- [ ] `service_role` key **tidak** ada di repo / `NEXT_PUBLIC_*`
- [ ] 4 secret wajib sudah di-set di Vercel — **rotasi setelah installs selesai**
- [ ] Cron deadline-notif dibuat di cron-job.org (URL di bagian 5) **dan** dinyalakan dari dashboard → Pengaturan → Notifikasi Deadline
- [ ] Token Fonnte diisi dari dashboard → Pengaturan → WhatsApp
- [ ] Logo sudah diganti
- [ ] Token Supabase (personal access token) dirotasi — token yang dipakai saat setup sudah pernah tampil di chat
- [ ] Token Cloudinary **API secret** dirotasi kalau pernah tampil di chat — dia bisa menghapus SEMUA aset di akun `rzwe62ed`
- [ ] Token Vercel dirotasi kalau pernah tampil di chat

