#!/usr/bin/env python3
"""
Generate aset brand JC Apparel dari satu berkas logo sumber.

Sumber: `docs/design/logo-jc-source.png` (PNG RGBA, logo transparan di atas
latar kosong). Jalankan ulang skrip ini kalau logonya diganti:

    python scripts/make-brand-assets.py

Yang dihasilkan:
  public/brand-logo.png     mark untuk sidebar admin + halaman login
  public/logo-mark.png      mark untuk header/footer halaman publik
  app/icon.png              ikon app (512x512)
  app/apple-icon.png        ikon Apple (180x180)
  app/favicon.ico           favicon 16/32/48
  docs/design/logo-master.png  master untuk mockup desain

Kenapa `brand-logo.png` dan `logo-mark.png` (bukan `*-jc.png`):
aset di `public/` dilayani `Cache-Control: immutable` selama satu tahun, jadi
menimpa isi berkas di URL yang sama tidak akan terlihat. Nama berkas yang
netral lebih aman kalau brand-nya suatu saat diganti lagi.
"""
import os

from PIL import Image

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
SOURCE = os.path.join(ROOT, "docs", "design", "logo-jc-source.png")
PUBLIC = os.path.join(ROOT, "public")
APP = os.path.join(ROOT, "app")
DESIGN = os.path.join(ROOT, "docs", "design")

# Latar app icon: gelap, supaya mark putih-nya kelihatan di tab browser
# berlatar terang.
DARK = (10, 10, 10, 255)


def load_mark() -> Image.Image:
    """Logo sumber, di-crop ke isi dan dibersihkan dari fringe."""
    im = Image.open(SOURCE).convert("RGBA")
    bbox = im.getchannel("A").getbbox()
    if bbox:
        im = im.crop(bbox)
    return im


def save_transparent(im: Image.Image, path: str, width: int):
    """Simpan mark dengan latar transparan, lebar tertentu."""
    h = max(1, round(im.height * width / im.width))
    out = im.resize((width, h), Image.LANCZOS)
    out.save(path, optimize=True)
    print(f"  {os.path.relpath(path, ROOT)}  {out.size}  {os.path.getsize(path) // 1024} KB")


def save_on_dark(im: Image.Image, path: str, size: int, pad_ratio: float = 0.08):
    """Simpan mark di atas latar gelap, proporsional dan terpusat."""
    inner = int(size * (1 - pad_ratio * 2))
    w = inner
    h = max(1, round(im.height * w / im.width))
    if h > inner:
        h = inner
        w = max(1, round(im.width * h / im.height))
    mark = im.resize((w, h), Image.LANCZOS)

    canvas = Image.new("RGBA", (size, size), DARK)
    canvas.alpha_composite(mark, ((size - w) // 2, (size - h) // 2))
    canvas.save(path, optimize=True)
    print(f"  {os.path.relpath(path, ROOT)}  {canvas.size}  {os.path.getsize(path) // 1024} KB")
    return canvas


def main():
    if not os.path.exists(SOURCE):
        raise SystemExit(f"sumber logo tidak ditemukan: {SOURCE}")

    print("menghasilkan aset brand dari", os.path.relpath(SOURCE, ROOT))
    mark = load_mark()
    print(f"isi logo: {mark.size} (rasio {mark.width / mark.height:.3f})\n")

    print("logo di halaman (latar transparan):")
    save_transparent(mark, os.path.join(PUBLIC, "brand-logo.png"), 600)
    save_transparent(mark, os.path.join(PUBLIC, "logo-mark.png"), 384)

    print("\nikon app (latar gelap):")
    icon = save_on_dark(mark, os.path.join(APP, "icon.png"), 512)
    save_on_dark(mark, os.path.join(APP, "apple-icon.png"), 180)

    ico = os.path.join(APP, "favicon.ico")
    icon.save(ico, sizes=[(16, 16), (32, 32), (48, 48)])
    print(f"  {os.path.relpath(ico, ROOT)}  {icon.size}  {os.path.getsize(ico) // 1024} KB")

    print("\nmaster untuk mockup desain:")
    save_on_dark(mark, os.path.join(DESIGN, "logo-master.png"), 1254, pad_ratio=0.12)


if __name__ == "__main__":
    main()
