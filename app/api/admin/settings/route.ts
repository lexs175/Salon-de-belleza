import { NextResponse } from "next/server";
import { getSettings, hashPassword, updatePassword, updateSettings } from "@/lib/db";
import { isAdminRequest, unauthorized } from "@/lib/admin-guard";

export async function GET() {
  if (!(await isAdminRequest())) return unauthorized();
  const s = await getSettings();
  const safe = {
    salon_name: s.salon_name,
    slogan: s.slogan,
    description: s.description,
    address: s.address,
    phone: s.phone,
    instagram: s.instagram,
    tiktok: s.tiktok,
    currency: s.currency,
    hours: s.hours,
  };
  return NextResponse.json({ settings: safe });
}

export async function PUT(request: Request) {
  if (!(await isAdminRequest())) return unauthorized();
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });

  if (typeof body.salon_name === "string") {
    const current = await getSettings();
    const hours =
      typeof body.hours === "object" && body.hours !== null
        ? JSON.stringify(body.hours)
        : current.hours;
    await updateSettings({
      salon_name: body.salon_name.trim() || current.salon_name,
      slogan: typeof body.slogan === "string" ? body.slogan.trim() : current.slogan,
      description:
        typeof body.description === "string" ? body.description.trim() : current.description,
      address: typeof body.address === "string" ? body.address.trim() : current.address,
      phone: typeof body.phone === "string" ? body.phone.trim() : current.phone,
      instagram:
        typeof body.instagram === "string" ? body.instagram.trim() : current.instagram,
      tiktok: typeof body.tiktok === "string" ? body.tiktok.trim() : current.tiktok,
      currency: typeof body.currency === "string" ? body.currency.trim() : current.currency,
      hours,
    });
  }

  if (typeof body.new_password === "string" && body.new_password.length >= 6) {
    await updatePassword(hashPassword(body.new_password));
  }

  return NextResponse.json({ ok: true });
}