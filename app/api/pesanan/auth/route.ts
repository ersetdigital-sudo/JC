import { NextResponse } from "next/server";
import {
  normalizePassword,
  resolveAdminPasswordSource,
  verifyAgainstSource,
} from "@/lib/admin-password";

/**
 * Password dashboard dari database (`app_settings.admin_password_hash`) atau,
 * kalau belum pernah diganti, dari env `PESANAN_PASSWORD` — sengaja tidak ada
 * nilai cadangan yang ditulis di kode.
 *
 * Dulu ada nilai cadangan yang ditulis langsung di baris ini, dan itu dua
 * masalah sekaligus: password produksi jadi tertulis di repo (siapa pun yang
 * membaca kode bisa mencobanya), dan mengosongkan env var TIDAK benar-benar
 * menutup akses karena nilai cadangan itu tetap berlaku sebagai pintu belakang.
 */
export async function POST(request: Request) {
  const source = await resolveAdminPasswordSource();

  if (!source) {
    // Gagal-tertutup: lebih baik login ditolak daripada diam-diam memakai
    // password yang ada di kode.
    console.error(
      "[pesanan-auth] ditolak: PESANAN_PASSWORD belum di-set dan belum ada password tersimpan"
    );
    return NextResponse.json(
      { error: "Server belum dikonfigurasi: PESANAN_PASSWORD belum di-set." },
      { status: 500 }
    );
  }

  const { password } = await request.json().catch(() => ({ password: "" }));

  // Trim dulu: spasi/newline yang kebawa dari autofill atau paste sering bikin gagal.
  const submitted = normalizePassword(password);

  if (!verifyAgainstSource(submitted, source)) {
    // Catat panjangnya saja (bukan isinya) biar gampang diagnosa lewat Vercel logs.
    console.warn("[pesanan-auth] mismatch", {
      receivedLength: submitted.length,
      source: source.kind,
    });
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set("pesanan_auth", "true", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return response;
}
