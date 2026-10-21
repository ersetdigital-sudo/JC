-- ============================================================================
-- JC Apparel — 0013 logo brand final (monogram JC)
-- ============================================================================
-- Logo resmi JC Apparel sudah masuk: monogram "JC" (bentuk kepala fox/wolf)
-- sebagai satu-satunya lambang — tanpa wordmark terpisah, karena nama brand
-- sudah dirender sebagai teks di samping mark-nya di sidebar dan login.
--
-- Yang berubah:
--   /brand-logo-jc.png  ->  /brand-logo.png   (mark, 600x406, transparan)
--   /logo-jc-mark.png   ->  /logo-mark.png    (mark kecil, 384x260, transparan)
--
-- Nama berkasnya neutrophil-nAMA-BRAND ("brand-logo", "logo-mark") supaya
-- aset di `public/` bisa dipakai ulang kalau brand-nya diganti lagi. Sekalian
-- menghindari masalah cache: aset di `public/` dilayani `Cache-Control:
-- immutable` selama satu tahun, jadi menimpa isi berkas di URL yang sama
-- tidak akan terlihat di browser yang sudah pernah meng-cache-nya.
--
-- `public/brand-logo-jc.png` dan `public/logo-jc-mark.png` (placeholder
-- badge monogram) dihapus berkasnya.
--
-- Aman dijalankan berulang.
-- ============================================================================

update public.brand
set logo_path  = '/brand-logo.png',
    updated_at = now()
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
  '/brand-logo.png'
)
on conflict (id) do nothing;

-- VERIFIKASI
--   select id, name, monogram, logo_path, updated_at from public.brand where id = 1;
--   -- logo_path harus '/brand-logo.png'
