#!/usr/bin/env python3
"""
Generate placeholder logo JC Apparel.

Logo ini adalah PLACEHOLDER supaya aplikasi tidak menampilkan logo brand
lama. Untuk memakai logo asli, taruh berkasnya dengan nama yang sama
(lihat docs/brand-assets.md).
"""
import os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
FONTS = os.path.join(ROOT, "fonts")
PUBLIC = os.path.join(ROOT, "public")

BLACK = (0, 0, 0, 255)
WHITE = (255, 255, 255, 255)


def font(name, size):
    return ImageFont.truetype(os.path.join(FONTS, name), size)


def text_size(draw, s, f):
    box = draw.textbbox((0, 0), s, font=f)
    return box[2] - box[0], box[3] - box[1]


def draw_tracked(draw, xy, s, f, fill, tracking):
    """Gambar teks dengan jarak antar huruf (letter-spacing)."""
    x, y = xy
    for ch in s:
        draw.text((x, y), ch, font=f, fill=fill)
        w, _ = text_size(draw, ch, f)
        x += w + tracking
    return x - tracking - xy[0]


def tracked_width(draw, s, f, tracking):
    w, _ = text_size(draw, s, f)
    return w + tracking * (len(s) - 1)


def fit_font(draw, s, name, max_w, start, min_size):
    size = start
    while size > min_size:
        f = font(name, size)
        if text_size(draw, s, f)[0] <= max_w:
            return f
        size -= 2
    return font(name, min_size)


def make_lockup(path):
    """Logo mendatar: badge hitam, monogram JC besar, bar bawah APPAREL."""
    W, H = 900, 384
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    outer = (16, 16, W - 16, H - 16)
    radius = 44

    badge = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    bd = ImageDraw.Draw(badge)
    bd.rounded_rectangle(outer, radius=radius, fill=BLACK)

    # Bar putih di bawah (mengikuti tata letak logo sebelumnya).
    bd.rectangle((outer[0], 268, outer[2], outer[3]), fill=WHITE)

    # Monogram "JC" — Archivo Black, putih, di area atas.
    main = fit_font(bd, "JC", "archivo-black.ttf", 560, 240, 80)
    tw, th = text_size(bd, "JC", main)
    bd.text((W / 2, 148), "JC", font=main, fill=WHITE, anchor="mm")

    # Wordmark "APPAREL" — hitam, letter-spacing lebar, di bar putih.
    sub = font("archivo-bold.ttf", 54)
    label = "A P P A R E L"
    lw = text_size(bd, label, sub)[0]
    bd.text(((W - lw) / 2, 300), label, font=sub, fill=BLACK)

    # Mask rounded + garis tepi putih.
    mask = Image.new("L", (W, H), 0)
    ImageDraw.Draw(mask).rounded_rectangle(outer, radius=radius, fill=255)
    badge.putalpha(mask)

    d.rounded_rectangle(outer, radius=radius, outline=WHITE, width=8)

    img = Image.alpha_composite(img, badge)
    # Garis tepi digambar ulang di atas badge.
    d = ImageDraw.Draw(img)
    d.rounded_rectangle(outer, radius=radius, outline=WHITE, width=8)

    img.save(path)
    print("wrote", path, img.size)


def make_mark(path):
    """Logo kecil: badge monogram JC."""
    S = 128
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    outer = (4, 4, S - 4, S - 4)
    radius = 24

    badge = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    bd = ImageDraw.Draw(badge)
    bd.rounded_rectangle(outer, radius=radius, fill=BLACK)

    f = font("archivo-black.ttf", 62)
    tw, th = text_size(bd, "JC", f)
    bd.text((S / 2, (S - th) / 2 - 2), "JC", font=f, fill=WHITE, anchor="mm")

    mask = Image.new("L", (S, S), 0)
    ImageDraw.Draw(mask).rounded_rectangle(outer, radius=radius, fill=255)
    badge.putalpha(mask)

    img = Image.alpha_composite(img, badge)
    d = ImageDraw.Draw(img)
    d.rounded_rectangle(outer, radius=radius, outline=WHITE, width=5)

    img.save(path)
    print("wrote", path, img.size)


if __name__ == "__main__":
    make_lockup(os.path.join(PUBLIC, "brand-logo-jc.png"))
    make_mark(os.path.join(PUBLIC, "logo-jc-mark.png"))
