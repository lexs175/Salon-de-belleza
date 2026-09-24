import { NextResponse } from "next/server";
import { addService, getServices } from "@/lib/db";
import { isAdminRequest, unauthorized } from "@/lib/admin-guard";

export async function GET() {
  if (!(await isAdminRequest())) return unauthorized();
  const services = await getServices();
  return NextResponse.json({ services });
}

export async function POST(request: Request) {
  if (!(await isAdminRequest())) return unauthorized();
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
  const id = await addService({
    name,
    description: (body?.description ?? "").trim(),
    duration_minutes: duration,
    price,
    image: (body?.image ?? "").trim(),
  });
  return NextResponse.json({ ok: true, id }, { status: 201 });
}