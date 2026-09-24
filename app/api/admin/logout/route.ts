import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { COOKIE_NAME_ADMIN, destroySession } from "@/lib/auth";

export async function POST() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME_ADMIN)?.value;
  if (token) await destroySession(token);
  store.delete(COOKIE_NAME_ADMIN);
  return NextResponse.json({ ok: true });
}