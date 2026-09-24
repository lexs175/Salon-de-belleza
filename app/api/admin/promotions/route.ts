import { NextResponse } from "next/server";
import { isAdminRequest, unauthorized } from "@/lib/admin-guard";
import { addPromotion, getPromotions, getServices } from "@/lib/db";
import type { PromoType } from "@/lib/types";

export async function GET() {
  if (!(await isAdminRequest())) return unauthorized();
  const promotions = await getPromotions();
  return NextResponse.json({ promotions });
}

export async function POST(request: Request) {
  if (!(await isAdminRequest())) return unauthorized();
  const body = await request.json().catch(() => null);

  const title = String(body?.title ?? "").trim();
  if (!title) {
    return NextResponse.json({ error: "El título es obligatorio." }, { status: 400 });
  }

  const rawServiceId = body?.service_id;
  const serviceId =
    rawServiceId === "all" || rawServiceId === null || rawServiceId === 0 || rawServiceId === ""
      ? null
      : Number(rawServiceId);

  if (serviceId !== null) {
    if (Number.isNaN(serviceId)) {
      return NextResponse.json({ error: "Servicio inválido." }, { status: 400 });
    }
    const services = await getServices();
    const serviceExists = services.some((s) => s.id === serviceId);
    if (!serviceExists) {
      return NextResponse.json({ error: "El servicio seleccionado no existe." }, { status: 400 });
    }
  }

  const discount = Number(body?.discount ?? 0);
  if (Number.isNaN(discount) || discount < 1 || discount > 100) {
    return NextResponse.json({ error: "El descuento debe estar entre 1% y 100%." }, { status: 400 });
  }

  const promoType: PromoType = body?.promo_type === "first_visit" ? "first_visit" : "general";
  const startsAt = body?.starts_at ? String(body.starts_at).trim() : null;
  const endsAt = body?.ends_at ? String(body.ends_at).trim() : null;
  // Si es primera visita, cupo máximo no aplica (es 1 por número)
  const maxUses =
    promoType === "first_visit"
      ? null
      : body?.max_uses
      ? Math.max(1, Number(body.max_uses))
      : null;

  if (startsAt && endsAt && startsAt > endsAt) {
    return NextResponse.json({ error: "La fecha de inicio no puede ser posterior a la fecha de fin." }, { status: 400 });
  }

  const id = await addPromotion({
    title,
    text: String(body?.text ?? "").trim(),
    service_id: serviceId,
    promo_type: promoType,
    discount: Math.round(discount),
    starts_at: startsAt,
    ends_at: endsAt,
    max_uses: maxUses,
    active: body?.active ? 1 : 0,
  });

  return NextResponse.json({ ok: true, id });
}