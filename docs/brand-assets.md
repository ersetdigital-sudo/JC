# Aset brand JC Apparel

Logo resmi JC Apparel sudah terpasang: monogram "JC" (bentuk kepala fox/wolf)
sebagai satu-satunya lambang — **tanpa wordmark terpisah**, karena nama brand
sudah dirender sebagai teks di samping mark-nya di sidebar dashboard dan
halaman login.

| Berkas | Ukuran | Dipakai di |
| --- | --- | --- |
| `public/brand-logo.png` | 600 × 406 | Sidebar dashboard admin (`PesananDashboard`, `MaklonDashboard`) dan halaman login |
| `public/logo-mark.png` | 384 × 260 | Header/footer halaman publik: beranda, `/track`, `/status`, `/status/maklon` |
| `app/icon.png` | 512 × 512 | Ikon tab browser & PWA |
| `app/apple-icon.png` | 180 × 180 | Ikon "Add to Home Screen" di iOS |
| `app/favicon.ico` | 16/32/48 | Favicon |
| `docs/design/logo-jc-source.png` | 1536 × 1024 | Logo sumber (master) — dasar semua aset di atas |

Logo di `public/` berlatar **transparan** (dipakai di atas latar gelap sidebar).
Ikon aplikasi diletakkan di atas latar gelap `#0A0A0A` supaya mark putihnya
kelihatan di tab browser berlatar terang.

## Ukuran tampil di sidebar dashboard

Ukuran logo di sidebar diatur dari CSS (`app/globals.css`), bukan dari ukuran
berkas:

```css
.pas-brand-mark    { max-width: 124px; }        /* mark 124 x 84 */
.pas-brand-mark img { max-height: 84px; }        /* pengaman logo pengganti */
```

Monogram "JC" rasionya **1.48:1** (lambang berdiri, bukan lockup mendatar) —
pada lebar 176px tingginya jadi 119px dan memakan hampir seperempat sidebar.
Bloc brand dibatasi 124px supaya menu masih muat di layar laptop 768px tanpa
scroll. Di layar pendek (`max-height: 760px`) mark mengecil jadi 96 × 65px.

Kalau logo diganti dengan lambang yang **lebih tinggi**, `max-height` di `<img>`
yang menahan — bukan `max-width` — jadi rasio barunya nggak bikin sidebar meluber.

## Kalau logonya diganti

Jangan diedit manual satu per satu — jalankan ulang generator:

```bash
# 1. ganti docs/design/logo-jc-source.png dengan logo barumu (PNG RGBA)
# 2. jalankan:
python scripts/make-brand-assets.py
```

Skrip itu memotong logo ke area isinya, resize, dan menulis ulang keenam
aset sekaligus.

## Kalau nama berkasnya diganti (mis. karena ganti brand lagi)

Aset di `public/` dilayani dengan header:

```
Cache-Control: public, max-age=31536000, immutable
```

Artinya **menimpa isi berkas di URL yang sama tidak akan terlihat** — browser dan
CDN menyimpan berkas itu selama satu tahun. Kalau kamu menukar logo dengan nama
berkas yang sama, sebagian besar pengguna akan tetap melihat logo lama.

Solusinya: **ubah nama berkasnya** saat menukar logo, lalu update path-nya di
empat tempat ini:

- `lib/data.ts` → `brand.logoPath` (fallback saat database tidak terjangkau)
- `supabase/migrations/0013_logo_brand_final.sql` → `logo_path` (untuk database baru)
- `components/admin/PesananDashboard.tsx` & `components/admin/MaklonDashboard.tsx`
  → `src="/brand-logo.png"`
- `app/page.tsx`, `app/track/TrackForm.tsx`, `app/status/StatusClient.tsx`,
  `app/status/maklon/page.tsx` → `src="/logo-mark.png"`

Kalau `logo_path` di tabel `brand` (database) yang jadi sumber kebenaran, cukup
jalankan satu `update` — tidak perlu deploy ulang:

```sql
update public.brand set logo_path = '/brand-logo-v2.png' where id = 1;
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
