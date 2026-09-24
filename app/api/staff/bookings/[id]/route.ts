import { NextResponse } from "next/server";
import { checkStaffBookingConflict, getBooking, updateBooking } from "@/lib/db";
import { getLoggedStaff, unauthorizedStaff } from "@/lib/staff-guard";

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const staff = await getLoggedStaff();
  if (!staff) return unauthorizedStaff();

  const { id } = await ctx.params;
  const booking = await getBooking(Number(id));

  if (!booking) {
    return NextResponse.json({ error: "Reserva no encontrada." }, { status: 404 });
  }

  // Verificar que la reserva pertenezca a esta especialista
  if (booking.staff_id !== staff.id) {
    return NextResponse.json({ error: "No tienes permiso para modificar esta reserva." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Cuerpo de solicitud requerido." }, { status: 400 });
  }

  const validStatus = ["pendiente", "confirmada", "cancelada", "completada"];
  if (body.status && !validStatus.includes(body.status)) {
    return NextResponse.json({ error: "Estado inválido." }, { status: 400 });
  }

  const targetDate = body.date || booking.date;
  const targetTime = body.time || booking.time;
  const duration = booking.service_duration || 60;

  if (body.status !== "cancelada" && (body.date || body.time)) {
    const conflict = await checkStaffBookingConflict(
      Number(id),
      targetDate,
      targetTime,
      staff.id,
      duration,
      booking.service_id
    );
    if (conflict.hasConflict) {
      return NextResponse.json(
        {
          error:
            conflict.reason ||
            `Ya tienes un turno a las ${conflict.conflictingTime} con ${conflict.conflictingClient || "otra clienta"}. Por favor elige otro horario.`,
        },
        { status: 409 }
      );
    }
  }

  await updateBooking(Number(id), {
    date: body.date,
    time: body.time,
    status: body.status,
    notes: body.notes,
  });

  return NextResponse.json({ ok: true });
}
