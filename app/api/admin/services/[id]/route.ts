import { NextResponse } from "next/server";
import { deleteService, updateService } from "@/lib/db";
import { isAdminRequest, unauthorized } from "@/lib/admin-guard";

export async function PUT(
  request: Request,
  ctx: RouteContext<"/api/admin/services/[id]">
) {
  if (!(await isAdminRequest())) return unauthorized();
  const { id } = await ctx.params;
  const body = await request.json().catch(() => null);
  const name = body?.name?.trim();
  const duration = Number(body?.duration_minutes);
  const price = Number(body?.price);
  if (!name || !duration || duration <= 0 || Number.isNaN(price) || price < 0) {
    return NextResponse.json(
      { error: "Nombre, duración y precio son obligatorios." },
      { status: 400 }
    );
  }
  await updateService(Number(id), {
    name,
    description: (body?.description ?? "").trim(),
    duration_minutes: duration,
    price,
    image: (body?.image ?? "").trim(),
    active: body?.active === false ? 0 : 1,
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/admin/services/[id]">
) {
  if (!(await isAdminRequest())) return unauthorized();
  const { id } = await ctx.params;
  await deleteService(Number(id));
  return NextResponse.json({ ok: true });
}