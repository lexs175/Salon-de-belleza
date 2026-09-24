export function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return toDateStr(d);
}

export function formatPrice(currency: string, price: number): string {
  return `${currency} ${price.toLocaleString("es-BO")}`;
}

export function parseHours(hoursJson: string): Record<string, string | null> {
  try {
    return JSON.parse(hoursJson) as Record<string, string | null>;
  } catch {
    return {};
  }
}

export function normalizePhone(phone: string): string {
  const digits = (phone || "").replace(/\D/g, "");
  // Retiene los últimos 8 dígitos para comparar tolerando prefijos (+591, 00591, etc.)
  return digits.length > 8 ? digits.slice(-8) : digits;
}

export function waLink(phone: string, message: string): string {
  const digits = phone.replace(/[^\d]/g, "").replace(/^00/, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function waBookingMessage(b: {
  name: string;
  service_name?: string;
  date: string;
  time: string;
}): string {
  const day = new Date(b.date + "T00:00:00");
  const label = `${day.getDate()}/${day.getMonth() + 1}/${day.getFullYear()}`;
  return `Hola ${b.name}, te escribimos por tu reserva de ${b.service_name ?? "tu servicio"} el ${label} a las ${b.time}.`;
}

export function waRescheduleMessage(
  b: { name: string; service_name?: string },
  newDateStr: string,
  newTime: string,
  salonName?: string
): string {
  const day = new Date(newDateStr + "T00:00:00");
  const label = `${day.getDate()}/${day.getMonth() + 1}/${day.getFullYear()}`;
  const salon = salonName ? `de ${salonName}` : "del salón";
  return `Hola ${b.name}! Te escribimos ${salon}. Disculpa los inconvenientes, tuvimos un imprevisto con el horario que agendaste para ${b.service_name ?? "tu servicio"}. ¿Te quedaría bien si movemos tu cita para el ${label} a las ${newTime}? Quedamos atentos para confirmarte.`;
}

export function waCancelMessage(
  b: { name: string; service_name?: string },
  salonName?: string
): string {
  const salon = salonName ? `de ${salonName}` : "nuestro salón";
  return `Hola ${b.name}, lamentamos informarte que tu cita para ${b.service_name ?? "tu servicio"} en ${salon} ha sido cancelada. Esperamos poder atenderte pronto, puedes decirme otra fecha o agendar en la web.`;
}