import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { createServiceClient, serviceRoleConfigured } from "@/lib/supabase/server";

/**
 * Password dashboard disimpan sebagai hash scrypt di `app_settings`.
 *
 * Kenapa tabel itu: tabelnya sudah ada dan hanya bisa dibaca/ditulis lewat
 * service role (RLS-nya tidak dibuka untuk anon), jadi hash tidak pernah
 * terkirim ke browser. Format nilai: `scrypt$<salt-hex>$<hash-hex>`.
 *
 * Kalau hash belum ada (mis. instalasi lama), verifikasi jatuh ke env
 * `PESANAN_PASSWORD` — perilaku lama tetap jalan, dan begitu password diganti
 * dari dashboard, hash inilah yang dipakai.
 */
export const ADMIN_PASSWORD_KEY = "admin_password_hash";
export const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 200;

export type AdminPasswordSource =
  | { kind: "hash"; hash: string }
  | { kind: "env"; value: string };

/** Buang spasi/newline yang ikut dari autofill, paste, atau copy dari chat. */
export function normalizePassword(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

/** Perbandingan waktu-tetap untuk string biasa (env fallback). */
export function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) {
    // Tetap jalankan perbandingan supaya panjang tidak bocor lewat timing.
    timingSafeEqual(left, left);
    return false;
  }
  return timingSafeEqual(left, right);
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, saltHex, hashHex] = stored.split("$");
  if (scheme !== "scrypt" || !saltHex || !hashHex) return false;

  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");
  if (salt.length === 0 || expected.length === 0) return false;

  const actual = scryptSync(password, salt, expected.length);
  return timingSafeEqual(expected, actual);
}

/** Hash dari database, atau null kalau belum pernah diganti. */
export async function getStoredPasswordHash(): Promise<string | null> {
  if (!serviceRoleConfigured()) return null;

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", ADMIN_PASSWORD_KEY)
    .maybeSingle();

  if (error) {
    console.error("[admin-password] gagal membaca hash:", error.message);
    return null;
  }

  const value = data?.value?.trim();
  return value || null;
}

/**
 * Sumber password yang berlaku sekarang.
 * `null` berarti belum dikonfigurasi sama sekali (login harus gagal-tertutup).
 */
export async function resolveAdminPasswordSource(): Promise<AdminPasswordSource | null> {
  const hash = await getStoredPasswordHash();
  if (hash) return { kind: "hash", hash };

  const env = normalizePassword(process.env.PESANAN_PASSWORD);
  if (!env) return null;

  return { kind: "env", value: env };
}

export function verifyAgainstSource(
  password: string,
  source: AdminPasswordSource
): boolean {
  return source.kind === "hash"
    ? verifyPassword(password, source.hash)
    : safeEqual(password, source.value);
}

export function validateNewPassword(
  currentPassword: string,
  newPassword: string
): string | null {
  if (!newPassword) return "Password baru wajib diisi.";
  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return `Password baru minimal ${MIN_PASSWORD_LENGTH} karakter.`;
  }
  if (newPassword.length > MAX_PASSWORD_LENGTH) {
    return `Password baru maksimal ${MAX_PASSWORD_LENGTH} karakter.`;
  }
  if (newPassword === currentPassword) {
    return "Password baru harus berbeda dari password saat ini.";
  }
  return null;
}
