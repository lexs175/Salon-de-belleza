import { NextResponse } from "next/server";
import { isAdminRequest, unauthorized } from "@/lib/admin-guard";
import { getBookings } from "@/lib/db";
import { normalizePhone } from "@/lib/format";
import type { Booking, ClientContact } from "@/lib/types";

export async function GET() {
  if (!(await isAdminRequest())) return unauthorized();

  const bookings = await getBookings();
  // Agrupar por teléfono normalizado (últimos 8 dígitos para WhatsApp)
  const clientMap = new Map<
    string,
    {
      rawPhone: string;
      names: Map<string, number>;
      bookings: Booking[];
    }
  >();

  for (const b of bookings) {
    const norm = normalizePhone(b.phone) || b.phone.replace(/\D/g, "");
    if (!norm) continue;

    if (!clientMap.has(norm)) {
      clientMap.set(norm, {
        rawPhone: b.phone,
        names: new Map(),
        bookings: [],
      });
    }

    const entry = clientMap.get(norm)!;
    entry.bookings.push(b);
    const cleanName = b.name.trim();
    if (cleanName) {
      entry.names.set(cleanName, (entry.names.get(cleanName) || 0) + 1);
    }
  }

  const contacts: ClientContact[] = [];

  for (const [, data] of clientMap.entries()) {
    // Nombre más representativo
    let bestName = "";
    let maxNameCount = 0;
    for (const [name, count] of data.names.entries()) {
      if (count > maxNameCount) {
        maxNameCount = count;
        bestName = name;
      }
    }
    if (!bestName && data.bookings.length > 0) {
      bestName = data.bookings[0].name;
    }

    // Ordenar reservas por fecha más reciente
    const sorted = [...data.bookings].sort((a, b) => {
      const dDiff = b.date.localeCompare(a.date);
      if (dDiff !== 0) return dDiff;
      return b.time.localeCompare(a.time);
    });

    const total_bookings = sorted.length;
    const completed_bookings = sorted.filter(
      (b) => b.status === "completada" || b.status === "confirmada"
    ).length;
    const cancelled_bookings = sorted.filter((b) => b.status === "cancelada").length;

    let total_spent = 0;
    const serviceCounts = new Map<string, number>();

    for (const b of sorted) {
      if (b.status !== "cancelada") {
        const price = b.service_price ?? 0;
        const discount = b.discount_applied ?? 0;
        total_spent += Math.max(0, price - discount);
      }
      if (b.service_name) {
        serviceCounts.set(b.service_name, (serviceCounts.get(b.service_name) || 0) + 1);
      }
    }

    // Servicio favorito
    let favService = "";
    let maxServiceCount = 0;
    const services_used: string[] = [];
    for (const [svc, count] of serviceCounts.entries()) {
      services_used.push(svc);
      if (count > maxServiceCount) {
        maxServiceCount = count;
        favService = svc;
      }
    }

    contacts.push({
      phone: data.rawPhone,
      name: bestName,
      total_bookings,
      completed_bookings,
      cancelled_bookings,
      total_spent,
      last_visit: sorted[0]?.date ?? "",
      first_visit: sorted[sorted.length - 1]?.date ?? "",
      favorite_service: favService || (services_used[0] ?? "Sin especificar"),
      services_used,
      bookings: sorted,
    });
  }

  // Ordenar por última visita más reciente
  contacts.sort((a, b) => b.last_visit.localeCompare(a.last_visit));

  return NextResponse.json({ contacts });
}
