-- ============================================================================
-- JC Apparel — 0014 tagline brand: Sportswear & Clothing Manufacturer
-- ============================================================================
-- Baris kedua tagline diganti:
--   "Desain bebas, harga pabrik, kirim se-Indonesia."
--   -> "Sportswear & Clothing Manufacturer"
--
-- Tagline ini dibaca dari mana-mana:
--   - baris 1 -> H1 beranda publik (`{brand.tagline}` split newline)
--   - baris 2 -> subline beranda + subline panel brand halaman login
-- Jadi satu perubahan di sini berlaku seragam di semua halaman.
--
-- Yang SENGAJA tidak diubah: `monogram`, `name`, dan `logo_path` (tetap JC Apparel).
--
-- `description` juga di-update: kalimat "Desain bebas, harga mulai 85rb, kirim
-- se-Indonesia." di situ punya slot yang sama dengan tagline baris 2, jadi
-- ikut ditukar supaya descriptor brand-nya seragam di mana-mana — termasuk di
-- meta description / og:description / twitter:description yang muncul di
-- /track, /status, /login, dan beranda.
--
-- CATATAN: konsekuensinya, info "harga mulai 85rb" tidak lagi ada di meta
-- description. Kalau mau harga tetap nongol,DESCRIPTION-nya bisa diubah
-- menjadi: "JC Apparel — Sportswear & Clothing Manufacturer, harga mulai 85rb,
-- kirim se-Indonesia. Konsultasi gratis via WhatsApp."
--
-- Migrasi baru, bukan mengedit 0012/0013: migrasi yang sudah dijalankan tidak
-- boleh diubah isinya (Supabase melacak migrasi per versi).
--
-- Aman dijalankan berulang.
-- ============================================================================

update public.brand
set tagline    = 'Tempat Bikin Jersey Futsal Custom.' || chr(10) || 'Sportswear & Clothing Manufacturer',
    description = 'JC Apparel — tempat bikin jersey futsal custom full printing. Sportswear & Clothing Manufacturer. Konsultasi gratis via WhatsApp.',
    updated_at = now()
where id = 1;

-- Database yang belum menjalankan 0003 tidak punya baris `brand` sama sekali.
insert into public.brand (id, name, monogram, tagline, description, whatsapp_number, logo_path)
values (
  1,
  'JC Apparel',
  'JC',
  'Tempat Bikin Jersey Futsal Custom.' || chr(10) || 'Sportswear & Clothing Manufacturer',
  'JC Apparel — tempat bikin jersey futsal custom full printing. Sportswear & Clothing Manufacturer. Konsultasi gratis via WhatsApp.',
  '628115491117',
  '/brand-logo.png'
)
on conflict (id) do nothing;

-- VERIFIKASI
--   select tagline, description from public.brand where id = 1;
--   -- tagline harus:
--   --   Tempat Bikin Jersey Futsal Custom.
--   --   Sportswear & Clothing Manufacturer
--   -- description harus memuat 'Sportswear & Clothing Manufacturer'
