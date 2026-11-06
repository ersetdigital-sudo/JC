import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/admin-auth";
import {
  ADMIN_PASSWORD_KEY,
  hashPassword,
  normalizePassword,
  resolveAdminPasswordSource,
  validateNewPassword,
  verifyAgainstSource,
} from "@/lib/admin-password";
import { checkRateLimit } from "@/lib/rate-limit";

/** 5 percobaan / 10 menit per IP — cukup untuk salah ketik, tidak untuk brute force. */
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 10 * 60 * 1000;

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return (
    forwarded?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * Ganti password dashboard.
 *
 * Password lama diverifikasi dari sumber yang sedang berlaku (hash di
 * `app_settings` atau env `PESANAN_PASSWORD`), lalu hash password baru
 * disimpan dengan key `admin_password_hash`. Setelah ini, login dan halaman
 * ganti password sama-sama memakai hash tersebut.
 */
export async function POST(request: Request) {
  if (!checkRateLimit(`akun-password:${clientIp(request)}`, RATE_LIMIT, RATE_WINDOW_MS)) {
    return NextResponse.json(
      { error: "Terlalu banyak percobaan. Coba lagi beberapa menit lagi." },
      { status: 429 }
    );
  }

  const supabase = await getAdminDb();
  if (!supabase) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const currentPassword = normalizePassword(body?.currentPassword);
  const newPassword = normalizePassword(body?.newPassword);

  if (!currentPassword) {
    return NextResponse.json(
      { error: "Password saat ini wajib diisi." },
      { status: 400 }
    );
  }

  const validationError = validateNewPassword(currentPassword, newPassword);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const source = await resolveAdminPasswordSource();
  if (!source) {
    return NextResponse.json(
      { error: "Server belum dikonfigurasi: PESANAN_PASSWORD belum di-set." },
      { status: 500 }
    );
  }

  if (!verifyAgainstSource(currentPassword, source)) {
    return NextResponse.json(
      { error: "Password saat ini salah." },
      { status: 400 }
    );
  }

  const { error } = await supabase.from("app_settings").upsert(
    {
      key: ADMIN_PASSWORD_KEY,
      value: hashPassword(newPassword),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" }
  );

  if (error) {
    console.error("[akun-password] gagal menyimpan hash:", error.message);
    return NextResponse.json(
      { error: "Gagal menyimpan password baru. Coba lagi." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
