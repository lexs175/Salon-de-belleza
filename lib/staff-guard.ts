import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getStaffMember } from "./db";
import type { StaffMember } from "./types";

export const STAFF_COOKIE_NAME = "salon_staff_session";
const SESSION_DAYS = 30; // 30 días de sesión en el celular de la estilista

function getSecretKey(): string {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || "salon_secret_key_staff_2026";
}

export function signStaffToken(staffId: number, expiresAt: number): string {
  const secret = getSecretKey();
  const data = `${staffId}:${expiresAt}`;
  const hmac = createHmac("sha256", secret).update(data).digest("hex");
  return `${data}:${hmac}`;
}

export function parseStaffToken(token: string): { staffId: number; expiresAt: number } | null {
  if (!token) return null;
  const parts = token.split(":");
  if (parts.length !== 3) return null;
  const staffId = Number(parts[0]);
  const expiresAt = Number(parts[1]);
  const providedHmac = parts[2];

  if (!staffId || !expiresAt || !providedHmac) return null;
  if (Date.now() > expiresAt) return null;

  const secret = getSecretKey();
  const data = `${staffId}:${expiresAt}`;
  const expectedHmac = createHmac("sha256", secret).update(data).digest("hex");

  try {
    const a = Buffer.from(providedHmac, "hex");
    const b = Buffer.from(expectedHmac, "hex");
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }

  return { staffId, expiresAt };
}

export async function createStaffSession(staffId: number): Promise<{ token: string; expiresAt: number }> {
  const expiresAt = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const token = signStaffToken(staffId, expiresAt);
  return { token, expiresAt };
}

export async function getLoggedStaff(): Promise<StaffMember | null> {
  const store = await cookies();
  const token = store.get(STAFF_COOKIE_NAME)?.value;
  if (!token) return null;

  const parsed = parseStaffToken(token);
  if (!parsed) return null;

  const member = await getStaffMember(parsed.staffId);
  if (!member || !member.active) return null;

  return member;
}

export async function isStaffRequest(): Promise<boolean> {
  const staff = await getLoggedStaff();
  return !!staff;
}

export function unauthorizedStaff(): NextResponse {
  return NextResponse.json({ error: "No autorizado como especialista." }, { status: 401 });
}
