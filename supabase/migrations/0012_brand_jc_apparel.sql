-- ============================================================================
-- JC Apparel — 0012 rebrand identitas toko (dari TAFF Sportwear)
-- ============================================================================
-- Rebrand ini hanya mengubah baris `brand`: nama, monogram, tagline,
-- deskripsi, dan `logo_path`.
--
-- Kenapa migrasi baru, bukan mengedit 0010/0011:
-- migrasi yang sudah dijalankan tidak boleh diubah isinya — Supabase melacak
-- migrasi per versi, dan database produksi sudah menjalankan 0010/0011.
-- Database baru tetap berakhir benar: 0010 menulis "TAFF Sportwear", lalu
-- migrasi ini menimpanya jadi "JC Apparel".
--
-- Catatan `logo_path`:
-- berkas di `public/` dilayani dengan `Cache-Control: immutable, max-age=
-- 31536000`, jadi menimpa isi berkas di URL yang sama TIDAK akan menampilkan
-- logo baru di browser dan CDN yang sudah pernah membukanya (mUntil 1 tahun).
-- Karena itu berkas logonya punya nama baru: `/logo-taff-mark.png` (monogram
-- kecil) → `/logo-jc-mark.png`, dan lockup `/brand-logo.png` → `/brand-logo-jc.png`.
--
-- Prefix nomor pesanan (TAFF → JC) TIDAK ada di database — ia kode statis di
-- `lib/order-number.ts`. Prefix lama `TAFF` tetap diterima sebagai prefix
-- legacy supaya nomor yang sudah dikirim ke customer lewat WhatsApp tetap
-- bisa dilacak di halaman /track.
--
-- Aman dijalankan berulang.
-- ============================================================================

update public.brand
set name        = 'JC Apparel',
    monogram    = 'JC',
    tagline     = 'Tempat Bikin Jersey Futsal Custom.' || chr(10) || 'Desain bebas, harga pabrik, kirim se-Indonesia.',
    description = 'JC Apparel — tempat bikin jersey futsal custom full printing. Desain bebas, harga mulai 85rb, kirim se-Indonesia. Konsultasi gratis via WhatsApp.',
    logo_path   = '/brand-logo-jc.png',
    updated_at  = now()
where id = 1;

-- Database yang belum menjalankan 0003 tidak punya baris `brand` sama sekali;
-- buat supaya halaman publik tidak jatuh ke cadangan di lib/data.ts.
insert into public.brand (id, name, monogram, tagline, description, whatsapp_number, logo_path)
values (
  1,
  'JC Apparel',
  'JC',
  'Tempat Bikin Jersey Futsal Custom.' || chr(10) || 'Desain bebas, harga pabrik, kirim se-Indonesia.',
  'JC Apparel — tempat bikin jersey futsal custom full printing. Desain bebas, harga mulai 85rb, kirim se-Indonesia. Konsultasi gratis via WhatsApp.',
  '628115491117',
  '/brand-logo-jc.png'
)
on conflict (id) do nothing;

-- VERIFIKASI
--   select id, name, monogram, logo_path, updated_at from public.brand where id = 1;
--   -- name harus 'JC Apparel', monogram 'JC', logo_path '/brand-logo-jc.png'
