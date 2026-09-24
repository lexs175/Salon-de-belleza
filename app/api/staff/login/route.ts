import { NextResponse } from "next/server";
import { getStaffByEmail, verifyStaffCredentials } from "@/lib/db";
import { supabase } from "@/lib/supabase";
import { createStaffSession, STAFF_COOKIE_NAME } from "@/lib/staff-guard";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = body?.email?.trim();
  const password = body?.password;

  if (!email || !password) {
    return NextResponse.json(
      { error: "Correo y contraseña requeridos." },
      { status: 400 }
    );
  }

  let staff = null;

  // 1. Intentar autenticar con Supabase Auth (auth.users)
  try {
    const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (!authErr && authData?.user) {
      staff = await getStaffByEmail(email);
    }
  } catch {}

  // 2. Fallback de verificación
  if (!staff) {
    staff = await verifyStaffCredentials(email, password);
  }

  if (!staff || !staff.active) {
    return NextResponse.json(
      { error: "Credenciales incorrectas o cuenta inactiva." },
      { status: 401 }
    );
  }

  const { token, expiresAt } = await createStaffSession(staff.id);

  const res = NextResponse.json({
    ok: true,
    staff: {
      id: staff.id,
      name: staff.name,
      role: staff.role,
      avatar: staff.avatar,
      phone: staff.phone,
      email: staff.email,
    },
  });

  res.cookies.set(STAFF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(expiresAt),
  });

  return res;
}
