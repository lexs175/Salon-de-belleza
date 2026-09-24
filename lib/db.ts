import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { normalizePhone, parseHours, toDateStr } from "./format";
import { supabaseAdmin } from "./supabase";
import type { Booking, PromoType, Promotion, Service, Settings, StaffMember } from "./types";

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  if (!stored) return false;
  if (stored === password) return true; // Para soporte inicial si está en texto plano
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

export async function getSettings(): Promise<Settings> {
  const { data, error } = await supabaseAdmin
    .from("settings")
    .select("*")
    .eq("id", 1)
    .single();

  if (error || !data) {
    return {
      salon_name: "Salón de Belleza",
      slogan: "Tu belleza, nuestro arte",
      description: "Reserva tu cita en segundos. Cortes, color, manicure, maquillaje y mucho más.",
      address: "",
      phone: "",
      instagram: "",
      tiktok: "",
      currency: "Bs.",
      hours: JSON.stringify({
        "0": null,
        "1": "09:00-19:00",
        "2": "09:00-19:00",
        "3": "09:00-19:00",
        "4": "09:00-19:00",
        "5": "09:00-19:00",
        "6": "09:00-19:00",
      }),
    };
  }

  return {
    salon_name: data.salon_name ?? "Salón de Belleza",
    slogan: data.slogan ?? "",
    description: data.description ?? "",
    address: data.address ?? "",
    phone: data.phone ?? "",
    instagram: data.instagram ?? "",
    tiktok: data.tiktok ?? "",
    currency: data.currency ?? "Bs.",
    hours: typeof data.hours === "object" ? JSON.stringify(data.hours) : String(data.hours ?? "{}"),
  };
}

export async function getAdminPassword(): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from("settings")
    .select("admin_password")
    .eq("id", 1)
    .single();

  if (error || !data) return hashPassword("admin123");
  return data.admin_password;
}

function getLocalServices(activeOnly = false): Service[] {
  try {
    const Database = require("better-sqlite3");
    const dbPath = path.join(process.cwd(), "data", "salon.db");
    if (fs.existsSync(dbPath)) {
      const db = new Database(dbPath);
      const rows = activeOnly
        ? db.prepare("SELECT * FROM services WHERE active = 1 ORDER BY id ASC").all()
        : db.prepare("SELECT * FROM services ORDER BY id ASC").all();
      return rows.map((s: any) => ({
        id: Number(s.id),
        name: s.name,
        description: s.description ?? "",
        duration_minutes: Number(s.duration_minutes ?? 60),
        price: Number(s.price ?? 0),
        image: s.image ?? "",
        active: Number(s.active ?? 1),
      }));
    }
  } catch {}
  return [];
}

export async function getServices(activeOnly = false): Promise<Service[]> {
  try {
    let query = supabaseAdmin.from("services").select("*").order("id", { ascending: true });
    if (activeOnly) {
      query = query.eq("active", 1);
    }
    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      return data.map((s) => ({
        id: Number(s.id),
        name: s.name,
        description: s.description ?? "",
        duration_minutes: Number(s.duration_minutes ?? 60),
        price: Number(s.price ?? 0),
        image: s.image ?? "",
        active: Number(s.active ?? 1),
      }));
    }
  } catch {}
  return getLocalServices(activeOnly);
}

export async function getService(id: number): Promise<Service | undefined> {
  try {
    const { data, error } = await supabaseAdmin
      .from("services")
      .select("*")
      .eq("id", id)
      .single();

    if (!error && data) {
      return {
        id: Number(data.id),
        name: data.name,
        description: data.description ?? "",
        duration_minutes: Number(data.duration_minutes ?? 60),
        price: Number(data.price ?? 0),
        image: data.image ?? "",
        active: Number(data.active ?? 1),
      };
    }
  } catch {}

  const all = getLocalServices(false);
  return all.find((s) => s.id === id);
}

const STAFF_FILE = path.join(process.cwd(), "data", "staff.json");

function readLocalStaff(): StaffMember[] {
  try {
    if (fs.existsSync(STAFF_FILE)) {
      return JSON.parse(fs.readFileSync(STAFF_FILE, "utf8"));
    }
  } catch {}
  return [];
}

function writeLocalStaff(staff: StaffMember[]) {
  try {
    fs.writeFileSync(STAFF_FILE, JSON.stringify(staff, null, 2), "utf8");
  } catch {}
}

export async function getStaff(activeOnly = false, serviceId?: number): Promise<StaffMember[]> {
  const local = readLocalStaff();
  const localMap = new Map(local.map((l) => [l.id, l]));

  try {
    let query = supabaseAdmin.from("staff").select("*");
    if (activeOnly) query = query.eq("active", 1);
    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      let list: StaffMember[] = data.map((m: any) => {
        const loc = localMap.get(Number(m.id));
        return {
          id: Number(m.id),
          name: m.name,
          role: m.role ?? "",
          phone: m.phone ?? "",
          avatar: m.avatar ?? "",
          active: Number(m.active ?? 1),
          services: Array.isArray(m.services) ? m.services.map(Number) : [],
          email: m.email || loc?.email || undefined,
          password_hash: m.password_hash || loc?.password_hash || undefined,
        };
      });
      if (serviceId) {
        list = list.filter(
          (m) => !m.services || m.services.length === 0 || m.services.includes(Number(serviceId))
        );
      }
      return list;
    }
  } catch {}

  let fallback = local;
  if (activeOnly) fallback = fallback.filter((s) => s.active);
  if (serviceId) {
    fallback = fallback.filter(
      (s) => !s.services || s.services.length === 0 || s.services.includes(Number(serviceId))
    );
  }
  return fallback;
}

export async function getStaffMember(id: number): Promise<StaffMember | undefined> {
  const all = await getStaff();
  return all.find((s) => s.id === id);
}

export async function getStaffByEmail(email: string): Promise<StaffMember | undefined> {
  const normalized = email.trim().toLowerCase();
  const all = await getStaff();
  return all.find((s) => s.email?.trim().toLowerCase() === normalized);
}

export async function verifyStaffCredentials(
  email: string,
  pass: string
): Promise<StaffMember | null> {
  const member = await getStaffByEmail(email);
  if (!member || !member.active) return null;
  if (!member.password_hash) return null;
  const ok = verifyPassword(pass, member.password_hash);
  if (!ok) return null;
  return member;
}

export async function addStaffMember(input: {
  name: string;
  role: string;
  phone?: string;
  avatar?: string;
  services?: number[];
  email?: string;
  password?: string;
}): Promise<number> {
  const passHash = input.password ? hashPassword(input.password) : undefined;
  let createdId: number | null = null;

  try {
    const payload: Record<string, any> = {
      name: input.name,
      role: input.role,
      phone: input.phone || "",
      avatar: input.avatar || "",
      active: 1,
      services: input.services || [],
    };
    if (input.email) payload.email = input.email.trim().toLowerCase();

    const { data, error } = await supabaseAdmin
      .from("staff")
      .insert([payload])
      .select("id")
      .single();

    if (!error && data?.id) {
      createdId = Number(data.id);
    } else if (error) {
      delete payload.email;
      const { data: d2 } = await supabaseAdmin
        .from("staff")
        .insert([payload])
        .select("id")
        .single();
      if (d2?.id) createdId = Number(d2.id);
    }
  } catch {}

  const local = readLocalStaff();
  const nextId = createdId ?? (local.length > 0 ? Math.max(...local.map((s) => s.id)) + 1 : 1);
  const newMember: StaffMember = {
    id: nextId,
    name: input.name,
    role: input.role,
    phone: input.phone,
    avatar: input.avatar,
    active: 1,
    services: input.services || [],
    email: input.email ? input.email.trim().toLowerCase() : undefined,
    password_hash: passHash,
  };
  local.push(newMember);
  writeLocalStaff(local);
  return nextId;
}

export async function updateStaffMember(
  id: number,
  input: {
    name: string;
    role: string;
    phone?: string;
    avatar?: string;
    active: number;
    services?: number[];
    email?: string;
    password?: string;
  }
): Promise<void> {
  const passHash = input.password ? hashPassword(input.password) : undefined;

  try {
    const payload: Record<string, any> = {
      name: input.name,
      role: input.role,
      phone: input.phone || "",
      avatar: input.avatar || "",
      active: input.active,
      services: input.services || [],
    };
    if (input.email !== undefined) payload.email = input.email.trim().toLowerCase();

    const { error } = await supabaseAdmin
      .from("staff")
      .update(payload)
      .eq("id", id);

    if (error) {
      delete payload.email;
      await supabaseAdmin.from("staff").update(payload).eq("id", id);
    }
  } catch {}

  const local = readLocalStaff();
  const idx = local.findIndex((s) => s.id === id);
  if (idx !== -1) {
    const updated: StaffMember = {
      ...local[idx],
      name: input.name,
      role: input.role,
      phone: input.phone,
      avatar: input.avatar,
      active: input.active,
      services: input.services,
    };
    if (input.email !== undefined) updated.email = input.email ? input.email.trim().toLowerCase() : undefined;
    if (passHash) updated.password_hash = passHash;
    local[idx] = updated;
    writeLocalStaff(local);
  }
}

export async function deleteStaffMember(id: number): Promise<void> {
  try {
    await supabaseAdmin.from("staff").delete().eq("id", id);
  } catch {}

  const local = readLocalStaff();
  const filtered = local.filter((s) => s.id !== id);
  writeLocalStaff(filtered);
}

const BOOKING_STAFF_FILE = path.join(process.cwd(), "data", "booking_staff.json");

function readBookingStaffMap(): Record<string, number> {
  try {
    if (!fs.existsSync(BOOKING_STAFF_FILE)) return {};
    const content = fs.readFileSync(BOOKING_STAFF_FILE, "utf8");
    return JSON.parse(content) || {};
  } catch {
    return {};
  }
}

function writeBookingStaffMap(map: Record<string, number>) {
  try {
    const dir = path.dirname(BOOKING_STAFF_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(BOOKING_STAFF_FILE, JSON.stringify(map, null, 2), "utf8");
  } catch {}
}

export async function getBookings(date?: string): Promise<Booking[]> {
  let query = supabaseAdmin
    .from("bookings")
    .select("*, services(name, duration_minutes, price)");

  if (date) {
    query = query.eq("date", date).order("time", { ascending: true });
  } else {
    query = query.order("date", { ascending: false }).order("time", { ascending: true });
  }

  const { data, error } = await query;
  const staffMembers = await getStaff();
  const staffMap = new Map(staffMembers.map((s) => [s.id, s.name]));
  const bookingStaffMap = readBookingStaffMap();

  if (error || !data) return [];

  return data.map((b: any) => {
    let sId: number | null = b.staff_id ? Number(b.staff_id) : (bookingStaffMap[String(b.id)] ?? null);
    if (!sId && b.notes) {
      const match = String(b.notes).match(/^\[staff:(\d+)\]/);
      if (match) sId = Number(match[1]);
    }
    // Si no tiene especialista explícito pero el servicio solo lo atiende uno, inferir
    if (!sId && b.service_id) {
      const candidates = staffMembers.filter(
        (s) => s.active && s.services?.includes(Number(b.service_id))
      );
      if (candidates.length === 1) sId = candidates[0].id;
    }

    let promoId: number | null = b.promotion_id ? Number(b.promotion_id) : null;
    let discApplied: number = Number(b.discount_applied ?? 0);
    if (!promoId && b.notes) {
      const matchPromo = String(b.notes).match(/\[promo:(\d+):([\d.]+)\]/);
      if (matchPromo) {
        promoId = Number(matchPromo[1]);
        discApplied = Number(matchPromo[2]);
      }
    }

    const cleanNotes = String(b.notes ?? "")
      .replace(/^\[staff:\d+\]\s*/, "")
      .replace(/^\[promo:\d+:[\d.]+\]\s*/, "");

    return {
      id: Number(b.id),
      service_id: Number(b.service_id),
      service_name: b.services?.name ?? "Servicio",
      service_duration: Number(b.services?.duration_minutes ?? 60),
      service_price: Number(b.services?.price ?? 0),
      staff_id: sId,
      staff_name: sId ? staffMap.get(sId) || null : null,
      promotion_id: promoId,
      discount_applied: discApplied,
      name: b.name,
      phone: b.phone,
      date: b.date,
      time: b.time,
      notes: cleanNotes,
      status: b.status,
      created_at: b.created_at,
    };
  });
}

export async function getBooking(id: number): Promise<Booking | undefined> {
  const { data, error } = await supabaseAdmin
    .from("bookings")
    .select("*, services(name, duration_minutes, price)")
    .eq("id", id)
    .single();

  if (error || !data) return undefined;
  const staffMembers = await getStaff();
  const staffMap = new Map(staffMembers.map((s) => [s.id, s.name]));
  const bookingStaffMap = readBookingStaffMap();

  let sId: number | null = (data as any).staff_id
    ? Number((data as any).staff_id)
    : (bookingStaffMap[String(data.id)] ?? null);
  if (!sId && data.notes) {
    const match = String(data.notes).match(/^\[staff:(\d+)\]/);
    if (match) sId = Number(match[1]);
  }
  if (!sId && data.service_id) {
    const candidates = staffMembers.filter(
      (s) => s.active && s.services?.includes(Number(data.service_id))
    );
    if (candidates.length === 1) sId = candidates[0].id;
  }

  let promoId: number | null = (data as any).promotion_id ? Number((data as any).promotion_id) : null;
  let discApplied: number = Number((data as any).discount_applied ?? 0);
  if (!promoId && data.notes) {
    const matchPromo = String(data.notes).match(/\[promo:(\d+):([\d.]+)\]/);
    if (matchPromo) {
      promoId = Number(matchPromo[1]);
      discApplied = Number(matchPromo[2]);
    }
  }

  const cleanNotes = String(data.notes ?? "")
    .replace(/^\[staff:\d+\]\s*/, "")
    .replace(/^\[promo:\d+:[\d.]+\]\s*/, "");

  return {
    id: Number(data.id),
    service_id: Number(data.service_id),
    service_name: (data as any).services?.name ?? "Servicio",
    service_duration: Number((data as any).services?.duration_minutes ?? 60),
    service_price: Number((data as any).services?.price ?? 0),
    staff_id: sId,
    staff_name: sId ? staffMap.get(sId) || null : null,
    promotion_id: promoId,
    discount_applied: discApplied,
    name: data.name,
    phone: data.phone,
    date: data.date,
    time: data.time,
    notes: cleanNotes,
    status: data.status,
    created_at: data.created_at,
  };
}

export function hmToMin(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export async function checkStaffBookingConflict(
  excludeBookingId: number,
  date: string,
  time: string,
  staffId?: number | null,
  serviceDurationMinutes: number = 60,
  serviceId?: number
): Promise<{ hasConflict: boolean; conflictingClient?: string; conflictingTime?: string; reason?: string }> {
  const bookings = await getBookings(date);
  const targetStart = hmToMin(time);
  const targetEnd = targetStart + serviceDurationMinutes;

  if (staffId) {
    for (const b of bookings) {
      if (b.id === excludeBookingId) continue;
      if (b.status === "cancelada") continue;
      if (!b.staff_id || Number(b.staff_id) !== Number(staffId)) continue;

      const bStart = hmToMin(b.time);
      const bDuration = Number(b.service_duration || 60);
      const bEnd = bStart + bDuration;

      // Overlap: el intervalo de la cita colisiona
      if (targetStart < bEnd && targetEnd > bStart) {
        return {
          hasConflict: true,
          conflictingClient: b.name,
          conflictingTime: b.time,
          reason: `Este especialista ya tiene una cita a las ${b.time} con ${b.name}.`,
        };
      }
    }
    return { hasConflict: false };
  }

  // Si no se especificó un staffId fijo, verificar si al menos un especialista calificado está libre
  if (serviceId) {
    const qualified = await getStaff(true, serviceId);
    if (qualified.length > 0) {
      const anyFree = qualified.some((member) => {
        const memberBookings = bookings.filter(
          (b) => b.id !== excludeBookingId && b.status !== "cancelada" && Number(b.staff_id) === member.id
        );
        for (const b of memberBookings) {
          const bStart = hmToMin(b.time);
          const bDuration = Number(b.service_duration || 60);
          const bEnd = bStart + bDuration;
          if (targetStart < bEnd && targetEnd > bStart) return false;
        }
        return true;
      });

      if (!anyFree) {
        return {
          hasConflict: true,
          reason: "No hay ningún especialista disponible a esa hora para este servicio.",
        };
      }
    }
  }

  return { hasConflict: false };
}

export async function updateBooking(
  id: number,
  fields: {
    date?: string;
    time?: string;
    staff_id?: number | null;
    status?: string;
    notes?: string;
  }
): Promise<void> {
  const updatePayload: Record<string, any> = {};
  if (fields.date !== undefined) updatePayload.date = fields.date;
  if (fields.time !== undefined) updatePayload.time = fields.time;
  if (fields.status !== undefined) updatePayload.status = fields.status;
  if (fields.staff_id !== undefined) updatePayload.staff_id = fields.staff_id;
  if (fields.notes !== undefined) updatePayload.notes = fields.notes;

  try {
    const { error } = await supabaseAdmin.from("bookings").update(updatePayload).eq("id", id);
    if (error && fields.staff_id !== undefined) {
      delete updatePayload.staff_id;
      await supabaseAdmin.from("bookings").update(updatePayload).eq("id", id);
    }
  } catch {}

  if (fields.staff_id !== undefined) {
    const map = readBookingStaffMap();
    if (fields.staff_id) {
      map[String(id)] = Number(fields.staff_id);
    } else {
      delete map[String(id)];
    }
    writeBookingStaffMap(map);
  }
}

export async function deleteBooking(id: number): Promise<void> {
  await supabaseAdmin.from("bookings").delete().eq("id", id);
  const map = readBookingStaffMap();
  delete map[String(id)];
  writeBookingStaffMap(map);
}

export async function createBooking(input: {
  service_id: number;
  staff_id?: number | null;
  promotion_id?: number | null;
  discount_applied?: number;
  name: string;
  phone: string;
  date: string;
  time: string;
  notes: string;
}): Promise<number> {
  let staffIdToAssign = input.staff_id;

  // Si no se asignó staff_id, buscar profesionales calificados para este servicio y autoasignar
  const qualified = await getStaff(true, input.service_id);
  if (!staffIdToAssign && qualified.length > 0) {
    if (qualified.length === 1) {
      staffIdToAssign = qualified[0].id;
    } else {
      // Si hay varios calificados, asignar el que NO esté ocupado a esa hora
      const existing = await getBookings(input.date);
      const busyStaffIds = new Set(
        existing
          .filter((b) => b.time === input.time && b.status !== "cancelada" && b.staff_id)
          .map((b) => b.staff_id)
      );
      const freeCandidate = qualified.find((s) => !busyStaffIds.has(s.id));
      staffIdToAssign = freeCandidate ? freeCandidate.id : qualified[0].id;
    }
  }

  // Prepend [staff:X] y [promo:ID:DISCOUNT] in notes for resilient Supabase storage
  let compositeNotes = input.notes || "";
  if (input.promotion_id) {
    compositeNotes = `[promo:${input.promotion_id}:${input.discount_applied ?? 0}] ${compositeNotes}`.trim();
  }
  if (staffIdToAssign) {
    compositeNotes = `[staff:${staffIdToAssign}] ${compositeNotes}`.trim();
  }

  const payload: Record<string, any> = {
    service_id: input.service_id,
    name: input.name,
    phone: input.phone,
    date: input.date,
    time: input.time,
    notes: compositeNotes,
    status: "pendiente",
  };
  if (staffIdToAssign) {
    payload.staff_id = staffIdToAssign;
  }
  if (input.promotion_id) {
    payload.promotion_id = input.promotion_id;
    payload.discount_applied = input.discount_applied ?? 0;
  }

  let createdId: number | null = null;

  try {
    const { data, error } = await supabaseAdmin
      .from("bookings")
      .insert([payload])
      .select("id")
      .single();

    if (!error && data) createdId = Number(data.id);
  } catch {}

  // Fallback si la columna staff_id o promotion_id no existen aún en Supabase
  if (!createdId) {
    try {
      const fallbackPayload = { ...payload };
      delete fallbackPayload.staff_id;
      delete fallbackPayload.promotion_id;
      delete fallbackPayload.discount_applied;
      const { data, error } = await supabaseAdmin
        .from("bookings")
        .insert([fallbackPayload])
        .select("id")
        .single();
      if (!error && data) createdId = Number(data.id);
    } catch {}
  }

  const finalId = createdId ?? Date.now();

  // Guardar en SQLite local si existe
  try {
    const Database = require("better-sqlite3");
    const dbPath = path.join(process.cwd(), "data", "salon.db");
    if (fs.existsSync(dbPath)) {
      const db = new Database(dbPath);
      db.prepare(`
        INSERT OR REPLACE INTO bookings (id, service_id, name, phone, date, time, notes, status, promotion_id, discount_applied)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'pendiente', ?, ?)
      `).run(
        finalId,
        input.service_id,
        input.name,
        input.phone,
        input.date,
        input.time,
        compositeNotes,
        input.promotion_id ?? null,
        input.discount_applied ?? 0
      );
    }
  } catch {}

  // Guardar en booking_staff map local
  if (staffIdToAssign) {
    const map = readBookingStaffMap();
    map[String(finalId)] = staffIdToAssign;
    writeBookingStaffMap(map);
  }

  return finalId;
}

export async function addService(input: {
  name: string;
  description: string;
  duration_minutes: number;
  price: number;
  image: string;
}): Promise<number> {
  const { data, error } = await supabaseAdmin
    .from("services")
    .insert([
      {
        name: input.name,
        description: input.description,
        duration_minutes: input.duration_minutes,
        price: input.price,
        image: input.image,
        active: 1,
      },
    ])
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Error al agregar servicio");
  }
  return Number(data.id);
}

export async function updateService(
  id: number,
  input: {
    name: string;
    description: string;
    duration_minutes: number;
    price: number;
    image: string;
    active: number;
  }
): Promise<void> {
  await supabaseAdmin
    .from("services")
    .update({
      name: input.name,
      description: input.description,
      duration_minutes: input.duration_minutes,
      price: input.price,
      image: input.image,
      active: input.active,
    })
    .eq("id", id);
}

export async function deleteService(id: number): Promise<void> {
  await supabaseAdmin.from("services").delete().eq("id", id);
}

export async function updateSettings(input: Partial<Settings>): Promise<void> {
  const payload: Record<string, any> = {};
  if (input.salon_name !== undefined) payload.salon_name = input.salon_name;
  if (input.slogan !== undefined) payload.slogan = input.slogan;
  if (input.description !== undefined) payload.description = input.description;
  if (input.address !== undefined) payload.address = input.address;
  if (input.phone !== undefined) payload.phone = input.phone;
  if (input.instagram !== undefined) payload.instagram = input.instagram;
  if (input.tiktok !== undefined) payload.tiktok = input.tiktok;
  if (input.currency !== undefined) payload.currency = input.currency;
  if (input.hours !== undefined) {
    try {
      payload.hours = JSON.parse(input.hours);
    } catch {
      payload.hours = input.hours;
    }
  }

  await supabaseAdmin.from("settings").update(payload).eq("id", 1);
}

export async function updatePassword(hash: string): Promise<void> {
  await supabaseAdmin.from("settings").update({ admin_password: hash }).eq("id", 1);
}

function getLocalPromotions(): Promotion[] {
  try {
    const Database = require("better-sqlite3");
    const dbPath = path.join(process.cwd(), "data", "salon.db");
    if (fs.existsSync(dbPath)) {
      const db = new Database(dbPath);
      const rows = db.prepare("SELECT * FROM promotions ORDER BY active DESC, id DESC").all();
      const services = getLocalServices();
      const sMap = new Map(services.map((s) => [s.id, s]));

      // Conteo de reservas no canceladas por promoción
      const bookingCounts: Record<number, number> = {};
      try {
        const bRows = db.prepare("SELECT promotion_id, notes, status FROM bookings WHERE status != 'cancelada'").all();
        for (const b of bRows) {
          let pId = b.promotion_id ? Number(b.promotion_id) : null;
          if (!pId && b.notes) {
            const m = String(b.notes).match(/\[promo:(\d+):/);
            if (m) pId = Number(m[1]);
          }
          if (pId) {
            bookingCounts[pId] = (bookingCounts[pId] || 0) + 1;
          }
        }
      } catch {}

      return rows.map((p: any) => {
        const svcId =
          p.service_id !== null && p.service_id !== undefined && p.service_id !== ""
            ? Number(p.service_id)
            : null;
        const svc = svcId ? sMap.get(svcId) || null : null;
        const svcPrice = svc ? svc.price : (svcId ? Number(p.price || 0) : 0);

        return {
          id: Number(p.id),
          title: p.title,
          text: p.text ?? "",
          service_id: svcId,
          service_name: svc ? svc.name : (svcId ? "Servicio" : "Todos los servicios"),
          service_price: svcPrice,
          promo_type: (p.promo_type as PromoType) || "general",
          discount: Number(p.discount || 0),
          starts_at: p.starts_at || null,
          ends_at: p.ends_at || null,
          max_uses: p.max_uses ? Number(p.max_uses) : null,
          current_uses: bookingCounts[Number(p.id)] || 0,
          price: svcPrice,
          active: Number(p.active || 0),
          created_at: p.created_at,
        };
      });
    }
  } catch {}
  return [];
}

export async function getPromotions(): Promise<Promotion[]> {
  const services = await getServices();
  const sMap = new Map(services.map((s) => [s.id, s]));

  // Obtener reservas para contar usos
  const allBookings = await getBookings();
  const bookingCounts: Record<number, number> = {};
  for (const b of allBookings) {
    if (b.status !== "cancelada" && b.promotion_id) {
      bookingCounts[b.promotion_id] = (bookingCounts[b.promotion_id] || 0) + 1;
    }
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("promotions")
      .select("*")
      .order("active", { ascending: false })
      .order("id", { ascending: false });

    if (!error && data && data.length > 0) {
      return data.map((p: any) => {
        const svcId =
          p.service_id !== null && p.service_id !== undefined && p.service_id !== ""
            ? Number(p.service_id)
            : null;
        const svc = svcId ? sMap.get(svcId) || null : null;
        const svcPrice = svc ? svc.price : (svcId ? Number(p.price || 0) : 0);

        return {
          id: Number(p.id),
          title: p.title,
          text: p.text ?? "",
          service_id: svcId,
          service_name: svc ? svc.name : (svcId ? "Servicio" : "Todos los servicios"),
          service_price: svcPrice,
          promo_type: (p.promo_type as PromoType) || "general",
          discount: Number(p.discount || 0),
          starts_at: p.starts_at || null,
          ends_at: p.ends_at || null,
          max_uses: p.max_uses ? Number(p.max_uses) : null,
          current_uses: bookingCounts[Number(p.id)] || 0,
          price: svcPrice,
          active: Number(p.active || 0),
          created_at: p.created_at,
        };
      });
    }
  } catch {}

  return getLocalPromotions();
}

export async function getActivePromotion(): Promise<Promotion | undefined> {
  const promotions = await getPromotions();
  const today = toDateStr(new Date());

  // Buscar la promoción activa que cumpla vigencia de fechas y techo de usos
  return promotions.find((p) => {
    if (!p.active) return false;
    if (p.starts_at && today < p.starts_at) return false;
    if (p.ends_at && today > p.ends_at) return false;
    if (p.max_uses && (p.current_uses ?? 0) >= p.max_uses) return false;
    return true;
  });
}

export async function addPromotion(input: {
  title: string;
  text?: string;
  service_id: number | null;
  promo_type: PromoType;
  discount: number;
  starts_at?: string | null;
  ends_at?: string | null;
  max_uses?: number | null;
  active: number;
}): Promise<number> {
  // Exclusividad: Si esta promoción se activa, desactivar las demás
  if (input.active === 1) {
    try {
      await supabaseAdmin.from("promotions").update({ active: 0 }).neq("id", 0);
    } catch {}
    try {
      const Database = require("better-sqlite3");
      const dbPath = path.join(process.cwd(), "data", "salon.db");
      if (fs.existsSync(dbPath)) {
        const db = new Database(dbPath);
        db.prepare("UPDATE promotions SET active = 0").run();
      }
    } catch {}
  }

  const payload: Record<string, any> = {
    title: input.title,
    text: input.text ?? "",
    service_id: input.service_id,
    promo_type: input.promo_type,
    discount: input.discount,
    starts_at: input.starts_at || null,
    ends_at: input.ends_at || null,
    max_uses: input.max_uses || null,
    active: input.active,
  };

  let createdId: number | null = null;
  try {
    const { data, error } = await supabaseAdmin
      .from("promotions")
      .insert([payload])
      .select("id")
      .single();

    if (!error && data) createdId = Number(data.id);
  } catch {}

  const finalId = createdId ?? Date.now();

  try {
    const Database = require("better-sqlite3");
    const dbPath = path.join(process.cwd(), "data", "salon.db");
    if (fs.existsSync(dbPath)) {
      const db = new Database(dbPath);
      db.prepare(`
        INSERT OR REPLACE INTO promotions (id, title, text, service_id, promo_type, discount, starts_at, ends_at, max_uses, active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        finalId,
        input.title,
        input.text ?? "",
        input.service_id,
        input.promo_type,
        input.discount,
        input.starts_at || null,
        input.ends_at || null,
        input.max_uses || null,
        input.active
      );
    }
  } catch {}

  return finalId;
}

export async function updatePromotion(
  id: number,
  input: {
    title: string;
    text?: string;
    service_id: number | null;
    promo_type: PromoType;
    discount: number;
    starts_at?: string | null;
    ends_at?: string | null;
    max_uses?: number | null;
    active: number;
  }
): Promise<void> {
  // Exclusividad: Si se activa, desactivar las demás
  if (input.active === 1) {
    try {
      await supabaseAdmin.from("promotions").update({ active: 0 }).neq("id", id);
    } catch {}
    try {
      const Database = require("better-sqlite3");
      const dbPath = path.join(process.cwd(), "data", "salon.db");
      if (fs.existsSync(dbPath)) {
        const db = new Database(dbPath);
        db.prepare("UPDATE promotions SET active = 0 WHERE id != ?").run(id);
      }
    } catch {}
  }

  const payload: Record<string, any> = {
    title: input.title,
    text: input.text ?? "",
    service_id: input.service_id,
    promo_type: input.promo_type,
    discount: input.discount,
    starts_at: input.starts_at || null,
    ends_at: input.ends_at || null,
    max_uses: input.max_uses || null,
    active: input.active,
  };

  try {
    await supabaseAdmin.from("promotions").update(payload).eq("id", id);
  } catch {}

  try {
    const Database = require("better-sqlite3");
    const dbPath = path.join(process.cwd(), "data", "salon.db");
    if (fs.existsSync(dbPath)) {
      const db = new Database(dbPath);
      db.prepare(`
        UPDATE promotions
        SET title = ?, text = ?, service_id = ?, promo_type = ?, discount = ?, starts_at = ?, ends_at = ?, max_uses = ?, active = ?
        WHERE id = ?
      `).run(
        input.title,
        input.text ?? "",
        input.service_id,
        input.promo_type,
        input.discount,
        input.starts_at || null,
        input.ends_at || null,
        input.max_uses || null,
        input.active,
        id
      );
    }
  } catch {}
}

export async function deletePromotion(id: number): Promise<void> {
  try {
    await supabaseAdmin.from("promotions").delete().eq("id", id);
  } catch {}
  try {
    const Database = require("better-sqlite3");
    const dbPath = path.join(process.cwd(), "data", "salon.db");
    if (fs.existsSync(dbPath)) {
      const db = new Database(dbPath);
      db.prepare("DELETE FROM promotions WHERE id = ?").run(id);
    }
  } catch {}
}

export async function checkPromotionEligibility(
  promotionId: number,
  serviceId: number,
  phone: string
): Promise<{
  ok: boolean;
  error?: string;
  status?: number;
  promo?: Promotion;
  discount_applied?: number;
}> {
  const promotions = await getPromotions();
  const promo = promotions.find((p) => p.id === promotionId);

  if (!promo || !promo.active) {
    return { ok: false, status: 400, error: "La promoción no está disponible o no está activa." };
  }

  // Si la promoción está vinculada a un servicio específico, validar que coincida.
  // Si service_id es null, aplica a cualquier servicio.
  if (promo.service_id && Number(promo.service_id) !== Number(serviceId)) {
    return {
      ok: false,
      status: 400,
      error: `Esta promoción solo aplica al servicio "${promo.service_name || "especificado"}".`,
    };
  }

  const today = toDateStr(new Date());
  if (promo.starts_at && today < promo.starts_at) {
    return { ok: false, status: 400, error: `Esta promoción iniciará el ${promo.starts_at}.` };
  }
  if (promo.ends_at && today > promo.ends_at) {
    return { ok: false, status: 400, error: "Esta promoción ya ha vencido." };
  }

  if (promo.max_uses && (promo.current_uses ?? 0) >= promo.max_uses) {
    return {
      ok: false,
      status: 409,
      error: "Esta promoción ha alcanzado el límite máximo de usos disponibles.",
    };
  }

  if (promo.promo_type === "first_visit") {
    const norm = normalizePhone(phone);
    const allBookings = await getBookings();
    const alreadyUsed = allBookings.some((b) => {
      if (b.status === "cancelada") return false;
      if (Number(b.promotion_id) !== promotionId) return false;
      return normalizePhone(b.phone) === norm;
    });

    if (alreadyUsed) {
      return {
        ok: false,
        status: 409,
        error: "Este número de WhatsApp ya utilizó esta promoción de primera visita. ¡Te esperamos en tu cita!",
      };
    }
  }

  const service = await getService(serviceId);
  const basePrice = service ? service.price : (promo.service_price || 0);
  const discount_applied = Math.round((basePrice * promo.discount) / 100);

  return { ok: true, promo, discount_applied };
}

function minToHm(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export async function getAvailableSlots(
  dateStr: string,
  serviceId: number,
  staffId?: number | null,
  excludeBookingId?: number | null
): Promise<string[]> {
  const [service, settings] = await Promise.all([
    getService(serviceId),
    getSettings(),
  ]);
  if (!service) return [];

  const hours = parseHours(settings.hours);
  const dow = new Date(dateStr + "T00:00:00").getDay();
  const range = hours[String(dow)];
  if (!range) return [];

  const [openStr, closeStr] = range.split("-").map((t) => t.trim());
  const open = hmToMin(openStr);
  const close = hmToMin(closeStr);
  const duration = service.duration_minutes;

  const { data: bookingsData } = await supabaseAdmin
    .from("bookings")
    .select("*, services(duration_minutes)")
    .eq("date", dateStr)
    .neq("status", "cancelada");

  const staffMembers = await getStaff();
  const bookingStaffMap = readBookingStaffMap();

  const bookingsList = (bookingsData || [])
    .filter((b: any) => !excludeBookingId || Number(b.id) !== Number(excludeBookingId))
    .map((b: any) => {
    let sId: number | null = b.staff_id ? Number(b.staff_id) : (bookingStaffMap[String(b.id)] ?? null);
    if (!sId && b.notes) {
      const match = String(b.notes).match(/^\[staff:(\d+)\]/);
      if (match) sId = Number(match[1]);
    }
    if (!sId && b.service_id) {
      const candidates = staffMembers.filter(
        (s) => s.active && s.services?.includes(Number(b.service_id))
      );
      if (candidates.length === 1) sId = candidates[0].id;
    }

    return {
      time: b.time,
      staff_id: sId,
      duration_minutes: Number(b.services?.duration_minutes ?? 60),
    };
  });

  const qualifiedStaff = staffMembers.filter(
    (s) => s.active && s.services?.includes(serviceId)
  );

  const now = new Date();
  const isToday = dateStr === toDateStr(now);
  const nowMin = now.getHours() * 60 + now.getMinutes();

  const slots: string[] = [];

  // Si no hay profesionales registrados, se usa el modo global tradicional
  if (qualifiedStaff.length === 0) {
    const occupied = new Set<number>();
    for (const t of bookingsList) {
      const start = hmToMin(t.time);
      for (let i = start; i < start + t.duration_minutes; i++) occupied.add(i);
    }
    for (let start = open; start + duration <= close; start += 60) {
      if (isToday && start <= nowMin) continue;
      let free = true;
      for (let i = start; i < start + duration; i++) {
        if (occupied.has(i)) {
          free = false;
          break;
        }
      }
      if (free) slots.push(minToHm(start));
    }
    return slots;
  }

  // Si se seleccionó un profesional específico
  if (staffId) {
    const staffBookings = bookingsList.filter((b) => b.staff_id === staffId);
    const occupied = new Set<number>();
    for (const t of staffBookings) {
      const start = hmToMin(t.time);
      for (let i = start; i < start + t.duration_minutes; i++) occupied.add(i);
    }
    for (let start = open; start + duration <= close; start += 60) {
      if (isToday && start <= nowMin) continue;
      let free = true;
      for (let i = start; i < start + duration; i++) {
        if (occupied.has(i)) {
          free = false;
          break;
        }
      }
      if (free) slots.push(minToHm(start));
    }
    return slots;
  }

  // Si se seleccionó "Cualquiera": el horario está libre si AL MENOS UNO de los profesionales calificados está libre
  for (let start = open; start + duration <= close; start += 60) {
    if (isToday && start <= nowMin) continue;

    const hasAnyFreeStaff = qualifiedStaff.some((member) => {
      const memberBookings = bookingsList.filter((b) => b.staff_id === member.id);
      const occupied = new Set<number>();
      for (const t of memberBookings) {
        const s = hmToMin(t.time);
        for (let i = s; i < s + t.duration_minutes; i++) occupied.add(i);
      }
      for (let i = start; i < start + duration; i++) {
        if (occupied.has(i)) return false;
      }
      return true;
    });

    if (hasAnyFreeStaff) {
      slots.push(minToHm(start));
    }
  }

  return slots;
}