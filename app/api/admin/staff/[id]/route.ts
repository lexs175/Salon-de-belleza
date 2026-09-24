import { NextResponse } from "next/server";
import { deleteStaffMember, updateStaffMember } from "@/lib/db";
import { isAdminRequest, unauthorized } from "@/lib/admin-guard";
import { supabaseAdmin } from "@/lib/supabase";

export async function PUT(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminRequest())) return unauthorized();
  const { id } = await ctx.params;
  const body = await request.json().catch(() => null);
  const name = body?.name?.trim();
  const role = body?.role?.trim();

  if (!name || !role) {
    return NextResponse.json(
      { error: "Nombre y rol son requeridos." },
      { status: 400 }
    );
  }

  const email = body?.email !== undefined ? (body.email ? String(body.email).trim().toLowerCase() : "") : undefined;
  const password = body?.password ? String(body.password) : undefined;

  await updateStaffMember(Number(id), {
    name,
    role,
    phone: (body?.phone ?? "").trim(),
    avatar: (body?.avatar ?? "").trim(),
    active: body?.active === false || body?.active === 0 ? 0 : 1,
    services: Array.isArray(body?.services) ? body.services.map(Number) : [],
    email,
    password,
  });

  // Sincronizar en Supabase Authentication (auth.users)
  if (email) {
    try {
      const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
      const existing = usersData?.users?.find(
        (u) => u.email?.toLowerCase() === email
      );
      if (existing) {
        if (password) {
          await supabaseAdmin.auth.admin.updateUserById(existing.id, {
            password,
            user_metadata: { name, role, staff_id: Number(id) },
          });
        }
      } else if (password) {
        await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { name, role, staff_id: Number(id) },
        });
      }
    } catch {}
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminRequest())) return unauthorized();
  const { id } = await ctx.params;
  await deleteStaffMember(Number(id));
  return NextResponse.json({ ok: true });
}
