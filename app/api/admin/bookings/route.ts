import { NextResponse } from "next/server";
import { createBooking, getBookings } from "@/lib/db";
import { isAdminRequest, unauthorized } from "@/lib/admin-guard";

export async function GET(request: Request) {
  if (!(await isAdminRequest())) return unauthorized();
  const url = new URL(request.url);
  const date = url.searchParams.get("date") ?? undefined;
  const bookings = await getBookings(date || undefined);
  return NextResponse.json({ bookings });
}

export async function POST(request: Request) {
  if (!(await isAdminRequest())) return unauthorized();
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Datos requeridos." }, { status: 400 });

  const { service_id, name, phone, date, time, notes, staff_id } = body;
  const digitsOnly = String(phone ?? "").replace(/\D/g, "");
  if (!service_id || !name || !date || !time) {
    return NextResponse.json(
      { error: "Servicio, cliente, fecha y hora son obligatorios." },
      { status: 400 }
    );
  }
  if (!phone || digitsOnly.length < 7) {
    return NextResponse.json(
      { error: "Número de teléfono/WhatsApp inválido. Debe contener al menos 7 dígitos numéricos." },
      { status: 400 }
    );
  }

  const id = await createBooking({
    service_id: Number(service_id),
    staff_id: staff_id ? Number(staff_id) : undefined,
    name: String(name).trim(),
    phone: String(phone ?? "").trim(),
    date: String(date),
    time: String(time),
    notes: String(notes ?? "").trim(),
  });

  return NextResponse.json({ ok: true, id }, { status: 201 });
}