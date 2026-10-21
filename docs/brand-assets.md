# Aset brand JC Apparel

Semua aset logo ada di `public/`. Ganti isinya, **jangan ganti nama berkasnya**
kecuali kamu memang sedang melakukan rebranding lagi (lihat catatan cache di bawah).

| Berkas | Ukuran | Dipakai di |
| --- | --- | --- |
| `public/brand-logo-jc.png` | 900 × 384 | Sidebar dashboard admin (`PesananDashboard`, `MaklonDashboard`) dan halaman login |
| `public/logo-jc-mark.png` | 128 × 128 | Header/footer halaman publik: beranda, `/track`, `/status`, `/status/maklon` |

Berkas di repo ini masih **placeholder** (badge monogram "JC" dengan palet lama).
Ganti dengan logo asli kamu.

## Cara menukar logo

1. Simpan logo lockup-mu sebagai `public/brand-logo-jc.png` (rasio 900×384, PNG
   dengan background transparan).
2. Simpan monogram/mark-mu sebagai `public/logo-jc-mark.png` (rasio 1:1, 128×128).
3. Kalau nama berkasnya berbeda, update tiga tempat:
   - `lib/data.ts` → `brand.logoPath` (fallback saat database tidak terjangkau)
   - `supabase/migrations/0012_brand_jc_apparel.sql` → `logo_path` (untuk database baru)
   - `components/admin/PesananDashboard.tsx` & `components/admin/MaklonDashboard.tsx`
     → `src="/brand-logo-jc.png"`
   - `app/page.tsx`, `app/track/TrackForm.tsx`, `app/status/StatusClient.tsx`,
     `app/status/maklon/page.tsx` → `src="/logo-jc-mark.png"`

## Catatan cache (penting)

`next.config.mjs` menyajikan seluruh aset di `public/` dengan header:

```
Cache-Control: public, max-age=31536000, immutable
```

Artinya **menimpa isi berkas di URL yang sama tidak akan terlihat** — browser dan
CDN menyimpan berkas itu selama satu tahun. Kalau kamu menukar logo dengan nama
berkas yang sama, sebagian besar pengguna akan tetap melihat logo lama.

Solusinya: **ubah nama berkasnya** saat menukar logo, lalu update path-nya di
empat tempat yang disebut di atas. Contoh:

```
public/brand-logo-jc.png      →  public/brand-logo-jc-v2.png
public/logo-jc-mark.png       →  public/logo-jc-mark-v2.png
```

Sebagai ganti, kalau `logo_path` di tabel `brand` (database) yang jadi sumber
kebenaran, cukup jalankan satu `update` — tidak perlu deploy ulang:

```sql
update public.brand set logo_path = '/brand-logo-jc-v2.png' where id = 1;
```

## Warna brand

Token warna ada di `app/globals.css` (blok `:root` dan `.dark`). Palet sekarang:

| Token | Nilai | Peran |
| --- | --- | --- |
| `--pas-primary` | `#23BBB7` | Turquoise — aksen utama |
| `--pas-deep` | `#23627C` | Deep blue — gradien |
| `--pas-light` | `#D3EDEF` | Light blue — latar halus |
| `--pas-cream` | `#F0EADF` | Cream — latar terang |

Font: **Archivo** (teks & display) dan **JetBrains Mono** (nomor pesanan) —
berkasnya ada di `fonts/`, tanpa request ke Google Fonts saat build.

## Nama brand di teks statis

Nama toko yang tampil di halaman publik **dibaca dari tabel `brand`** di Supabase,
jadi bisa diubah dari dashboard (menu **Pengaturan → Profil Toko**) tanpa deploy.
Sidebar dan drawer dashboard admin juga ikut nama yang sama — kalau nama toko
diganti di Profil Toko, sidebar ikut berubah tanpa perlu refresh.

Yang masih ditulis statis di kode:

| Berkas | Isi |
| --- | --- |
| `lib/data.ts` | Fallback `brand` (dipakai kalau database tidak terjangkau) |
| `lib/fonnte.ts` | Nama brand di template pesan WhatsApp (4 tempat) |
| `app/api/admin/profil-toko/route.ts` | Fallback nama toko |
| `app/api/admin/settings/fonnte/test/route.ts` | Teks pesan tes notifikasi |
| `app/pesanan/orders/page.tsx`, `app/pesanan/maklon/page.tsx` | Judul tab browser panel admin (`Kelola Pesanan · JC Apparel`) |

> **Catatan:** judul tab browser panel admin sengaja dikunci (`title: { absolute: … }`)
> supaya tidak ikut berubah kalau baris `brand` diedit — itu keputusan pemilik
> toko di repo asal. Kalau mau judulnya ikut nama toko, ubah `absolute` jadi
> `generateMetadata()` yang memanggil `getBrand()`.

Menyimpan nama baru di **Profil Toko** mengubah `brand.name` di database — tapi
**tidak** mengubah `description` dan `monogram`. Metadata SEO (title + meta
description) masih memakai `description`, jadi kalau copy deskripsi toko juga
diubah, itu perlu lewat migrasi SQL atau diedit langsung di tabel `brand`.

## Domain & email

| Yang lama | Yang baru |
| --- | --- |
| `taffsport.id` | `jcapparel.id` |
| `admin@taffsport.id` | `admin@jcapparel.id` |
| `taffsport.vercel.app` | `jcapparel.vercel.app` |

Domain publik aplikasi tidak di-hardcode — dibaca dari `APP_URL` /
`VERCEL_PROJECT_PRODUCTION_URL` (lihat `lib/app-url.ts`). Set `APP_URL` di
project Vercel ke domain produksi kamu, karena link tracking yang dikirim ke
customer dibangun dari situ.
