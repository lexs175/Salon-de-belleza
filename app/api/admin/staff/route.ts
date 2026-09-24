import { NextResponse } from "next/server";
import { addStaffMember, getStaff } from "@/lib/db";
import { isAdminRequest, unauthorized } from "@/lib/admin-guard";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  if (!(await isAdminRequest())) return unauthorized();
  const staff = await getStaff(false);
  return NextResponse.json({ staff });
}

export async function POST(request: Request) {
  if (!(await isAdminRequest())) return unauthorized();
  const body = await request.json().catch(() => null);
  const name = body?.name?.trim();
  const role = body?.role?.trim();

  if (!name || !role) {
    return NextResponse.json(
      { error: "El nombre y el rol o especialidad son obligatorios." },
      { status: 400 }
    );
  }

  const email = body?.email ? String(body.email).trim().toLowerCase() : undefined;
  const password = body?.password ? String(body.password) : undefined;

  const id = await addStaffMember({
    name,
    role,
    phone: (body?.phone ?? "").trim(),
    avatar: (body?.avatar ?? "").trim(),
    services: Array.isArray(body?.services) ? body.services.map(Number) : [],
    email,
    password,
  });

  // Registrar en Supabase Authentication (auth.users)
  if (email && password) {
    try {
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name, role, staff_id: id },
      });
    } catch {}
  }

  return NextResponse.json({ ok: true, id }, { status: 201 });
}
