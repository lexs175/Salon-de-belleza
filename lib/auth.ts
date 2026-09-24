import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { supabaseAdmin } from "./supabase";

const COOKIE_NAME = "salon_session";
const SESSION_DAYS = 7;

function getSecretKey(): string {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || "salon_secret_admin_2026";
}

export function signAdminToken(expiresAt: number): string {
  const secret = getSecretKey();
  const data = `admin:${expiresAt}`;
  const hmac = createHmac("sha256", secret).update(data).digest("hex");
  return `${data}:${hmac}`;
}

export function parseAdminToken(token: string): { expiresAt: number } | null {
  if (!token) return null;
  const parts = token.split(":");
  if (parts.length !== 3 || parts[0] !== "admin") return null;
  const expiresAt = Number(parts[1]);
  const providedHmac = parts[2];

  if (!expiresAt || !providedHmac) return null;
  if (Date.now() > expiresAt) return null;

  const secret = getSecretKey();
  const data = `admin:${expiresAt}`;
  const expectedHmac = createHmac("sha256", secret).update(data).digest("hex");

  try {
    const a = Buffer.from(providedHmac, "hex");
    const b = Buffer.from(expectedHmac, "hex");
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }

  return { expiresAt };
}

export async function createSession(): Promise<{ token: string; expiresAt: number }> {
  const expiresAt = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const token = signAdminToken(expiresAt);
  // Backup opcional en base de datos si existe sessions table
  try {
    await supabaseAdmin.from("sessions").insert([{ token, expires_at: expiresAt }]);
  } catch {}
  return { token, expiresAt };
}

export async function destroySession(token: string): Promise<void> {
  try {
    await supabaseAdmin.from("sessions").delete().eq("token", token);
  } catch {}
}

export async function isValidToken(token: string): Promise<boolean> {
  if (!token) return false;

  // 1. Verificación rápida y resiliente por firma HMAC criptográfica
  const hmacValid = parseAdminToken(token);
  if (hmacValid) return true;

  // 2. Verificación por tabla sessions de Supabase (compatibilidad con tokens antiguos)
  try {
    const { data, error } = await supabaseAdmin
      .from("sessions")
      .select("expires_at")
      .eq("token", token)
      .single();

    if (!error && data) {
      const expiresAt = Number(data.expires_at);
      if (expiresAt >= Date.now()) return true;
      await supabaseAdmin.from("sessions").delete().eq("token", token);
    }
  } catch {}

  return false;
}

export async function isAuthenticated(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  return token ? await isValidToken(token) : false;
}

export async function getSessionToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(COOKIE_NAME)?.value ?? null;
}

export const COOKIE_NAME_ADMIN = COOKIE_NAME;