import { NextResponse } from "next/server";
import {
  checkStaffBookingConflict,
  deleteBooking,
  getBooking,
  updateBooking,
} from "@/lib/db";
import { isAdminRequest, unauthorized } from "@/lib/admin-guard";
import { supabaseAdmin } from "@/lib/supabase";

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminRequest())) return unauthorized();
  const params = await ctx.params;
  const id = params?.id;
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Cuerpo de solicitud requerido." }, { status: 400 });
  }

  const existing = await getBooking(Number(id));
  if (!existing) {
    return NextResponse.json({ error: "Reserva no encontrada." }, { status: 404 });
  }

  const targetStaffId =
    body.staff_id !== undefined
      ? body.staff_id
        ? Number(body.staff_id)
        : null
      : existing.staff_id;

  const targetDate = body.date || existing.date;
  const targetTime = body.time || existing.time;
  const duration = existing.service_duration || 60;

  // Si se está cambiando fecha u hora o asignando especialista, validar que no colisione
  if (
    body.status !== "cancelada" &&
    (body.date || body.time || body.staff_id !== undefined)
  ) {
    const conflict = await checkStaffBookingConflict(
      Number(id),
      targetDate,
      targetTime,
      targetStaffId,
      duration,
      existing.service_id
    );
    if (conflict.hasConflict) {
      return NextResponse.json(
        {
          error:
            conflict.reason ||
            `Este especialista ya tiene un turno a las ${conflict.conflictingTime} con ${conflict.conflictingClient || "otra clienta"}. Por favor elige otro horario.`,
        },
        { status: 409 }
      );
    }
  }

  await updateBooking(Number(id), {
    date: body.date,
    time: body.time,
    staff_id: targetStaffId,
    status: body.status,
    notes: body.notes,
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminRequest())) return unauthorized();
  const { id } = await ctx.params;
  await deleteBooking(Number(id));
  return NextResponse.json({ ok: true });
}