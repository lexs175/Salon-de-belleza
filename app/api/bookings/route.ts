import { checkPromotionEligibility, createBooking, getAvailableSlots, getService } from "@/lib/db";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) return Response.json({ error: "Datos inválidos." }, { status: 400 });

  const { serviceId, staffId, promotionId, date, time, name, phone, notes } = body as {
    serviceId: number;
    staffId?: number | null;
    promotionId?: number | null;
    date: string;
    time: string;
    name: string;
    phone: string;
    notes?: string;
  };

  const service = await getService(serviceId);
  if (!service || !service.active) {
    return Response.json({ error: "Servicio no disponible." }, { status: 400 });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date ?? "") || !/^\d{2}:\d{2}$/.test(time ?? "")) {
    return Response.json({ error: "Fecha u hora inválida." }, { status: 400 });
  }
  const digitsOnly = (phone ?? "").replace(/\D/g, "");
  if (!name?.trim()) {
    return Response.json({ error: "Escribe tu nombre." }, { status: 400 });
  }
  if (!phone?.trim() || digitsOnly.length < 7) {
    return Response.json(
      { error: "Número de teléfono/WhatsApp inválido. Debe contener solo números y al menos 7 dígitos." },
      { status: 400 }
    );
  }

  // Validar promoción si se envió
  let discountApplied = 0;
  if (promotionId) {
    const promoCheck = await checkPromotionEligibility(Number(promotionId), serviceId, phone);
    if (!promoCheck.ok) {
      return Response.json({ error: promoCheck.error }, { status: promoCheck.status || 400 });
    }
    discountApplied = promoCheck.discount_applied ?? 0;
  }

  const available = await getAvailableSlots(date, serviceId, staffId);
  if (!available.includes(time)) {
    return Response.json(
      { error: "Ese horario ya no está disponible. Elige otro." },
      { status: 409 }
    );
  }

  const id = await createBooking({
    service_id: serviceId,
    staff_id: staffId ? Number(staffId) : null,
    promotion_id: promotionId ? Number(promotionId) : null,
    discount_applied: discountApplied,
    name: name.trim(),
    phone: phone.trim(),
    date,
    time,
    notes: (notes ?? "").trim(),
  });

  return Response.json({ ok: true, id, discount_applied: discountApplied }, { status: 201 });
}