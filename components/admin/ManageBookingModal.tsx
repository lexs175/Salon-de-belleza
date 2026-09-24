"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  AlertTriangle,
  Calendar,
  Clock,
  Loader2,
  RefreshCw,
  User,
  X,
} from "lucide-react";
import { waCancelMessage, waLink, waRescheduleMessage } from "@/lib/format";
import type { Booking, StaffMember } from "@/lib/types";
import { showToast } from "./toast";

const DEFAULT_HOURS = [
  "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00",
  "18:00", "19:00", "20:00"
];

interface ManageBookingModalProps {
  booking: Booking;
  salonName?: string;
  currency?: string;
  staffList?: StaffMember[];
  isStaffView?: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ManageBookingModal({
  booking,
  salonName = "Salón de Belleza",
  currency = "Bs.",
  staffList = [],
  isStaffView = false,
  onClose,
  onSuccess,
}: ManageBookingModalProps) {
  const [tab, setTab] = useState<"reschedule" | "cancel">("reschedule");
  const [loading, setLoading] = useState(false);

  // Estados para reagendar
  const [newDate, setNewDate] = useState(booking.date);
  const [newTime, setNewTime] = useState(booking.time);
  const [newStaffId, setNewStaffId] = useState<number | "">(
    booking.staff_id || ""
  );
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotError, setSlotError] = useState<string | null>(null);

  // Consultar disponibilidad en tiempo real para evitar colisiones
  useEffect(() => {
    if (!newDate || !booking.service_id) return;
    let cancelled = false;
    setLoadingSlots(true);
    setSlotError(null);

    const staffQuery = isStaffView
      ? `&staffId=${booking.staff_id}`
      : newStaffId
      ? `&staffId=${newStaffId}`
      : "";

    fetch(
      `/api/slots?date=${newDate}&serviceId=${booking.service_id}${staffQuery}&excludeBookingId=${booking.id}`
    )
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const slots: string[] = data.slots || [];
        setAvailableSlots(slots);
        if (slots.length > 0) {
          if (!slots.includes(newTime)) {
            setNewTime(slots[0]);
          }
        } else {
          setSlotError(
            "Esta especialista no tiene horarios disponibles en la fecha seleccionada."
          );
        }
      })
      .catch(() => {
        if (!cancelled) setSlotError("Error al consultar disponibilidad de horarios.");
      })
      .finally(() => {
        if (!cancelled) setLoadingSlots(false);
      });

    return () => {
      cancelled = true;
    };
  }, [newDate, newStaffId, booking.service_id, booking.staff_id, isStaffView, booking.id]);

  // Preview del mensaje de WhatsApp
  const rescheduleMsg = waRescheduleMessage(booking, newDate, newTime, salonName);
  const cancelMsg = waCancelMessage(booking, salonName);

  // Cerrar con Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  async function handleReschedule() {
    if (!newDate || !newTime) {
      showToast("Por favor selecciona fecha y hora.", "error");
      return;
    }

    setLoading(true);
    try {
      const endpoint = isStaffView
        ? `/api/staff/bookings/${booking.id}`
        : `/api/admin/bookings/${booking.id}`;

      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: newDate,
          time: newTime,
          staff_id: isStaffView ? undefined : (newStaffId ? Number(newStaffId) : null),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al mover la cita.");
      }

      showToast("Cita reagendada con éxito.", "success");

      // Abrir WhatsApp con la propuesta precargada
      if (booking.phone) {
        const link = waLink(booking.phone, rescheduleMsg);
        window.open(link, "_blank");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err.message || "Error al reagendar.", "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel() {
    setLoading(true);
    try {
      const endpoint = isStaffView
        ? `/api/staff/bookings/${booking.id}`
        : `/api/admin/bookings/${booking.id}`;

      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "cancelada",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al cancelar la cita.");
      }

      showToast("Cita cancelada y horario liberado.", "success");

      // Abrir WhatsApp con el mensaje conversacional
      if (booking.phone) {
        const link = waLink(booking.phone, cancelMsg);
        window.open(link, "_blank");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err.message || "Error al cancelar.", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div
        className="bg-white rounded-[4px] border border-stone-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div className="p-5 sm:p-6 border-b border-stone-100 bg-stone-50/50 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-[4px]">
                Gestionar Cita #{booking.id}
              </span>
              <span className="text-xs text-stone-400 font-mono">
                {booking.date} · {booking.time}
              </span>
            </div>
            <h2 className="text-xl font-bold text-stone-900 mt-1">
              {booking.name}
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              {booking.service_name} {booking.service_price ? `(${currency} ${booking.service_price})` : ""}
              {booking.staff_name ? ` · Atiende: ${booking.staff_name}` : ""}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-[4px] hover:bg-stone-200/60 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Pestañas de modo */}
        <div className="flex border-b border-stone-200 bg-stone-100/60 p-1.5 gap-1.5">
          <button
            type="button"
            onClick={() => setTab("reschedule")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-[4px] transition-all cursor-pointer ${
              tab === "reschedule"
                ? "bg-white text-stone-900 shadow-xs"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            <RefreshCw size={14} className={tab === "reschedule" ? "text-rose-600" : ""} />
            <span>Mover / Reagendar</span>
          </button>
          <button
            type="button"
            onClick={() => setTab("cancel")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-[4px] transition-all cursor-pointer ${
              tab === "cancel"
                ? "bg-white text-red-600 shadow-xs"
                : "text-stone-600 hover:text-red-600"
            }`}
          >
            <AlertTriangle size={14} />
            <span>Cancelar Cita</span>
          </button>
        </div>

        {/* Contenido según pestaña */}
        <div className="p-5 sm:p-6 space-y-5">
          {tab === "reschedule" ? (
            /* ========================================================= */
            /* PESTAÑA: REAGENDAR                                        */
            /* ========================================================= */
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Selector de Nueva Fecha */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">
                    <Calendar size={13} className="inline mr-1 text-rose-500" />
                    Nueva Fecha
                  </label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full rounded-[4px] border border-stone-200 px-3 py-2 text-sm bg-stone-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-400"
                  />
                </div>

                {/* Selector de Nueva Hora */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center justify-between">
                    <span>
                      <Clock size={13} className="inline mr-1 text-rose-500" />
                      Nueva Hora
                    </span>
                    {loadingSlots && (
                      <span className="text-[10px] text-stone-400 font-normal flex items-center gap-1">
                        <Loader2 size={10} className="animate-spin" /> Verificando turnos...
                      </span>
                    )}
                  </label>
                  <select
                    value={newTime}
                    disabled={loadingSlots || availableSlots.length === 0}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full rounded-[4px] border border-stone-200 px-3 py-2 text-sm bg-stone-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-400 disabled:opacity-50"
                  >
                    {availableSlots.length === 0 && !loadingSlots ? (
                      <option value="">Sin turnos libres</option>
                    ) : (
                      DEFAULT_HOURS.map((h) => {
                        const isFree = availableSlots.includes(h);
                        return (
                          <option key={h} value={h} disabled={!isFree}>
                            {h} {!isFree ? "— (Ocupado / No disponible)" : ""}
                          </option>
                        );
                      })
                    )}
                  </select>
                </div>
              </div>

              {/* Selector de Especialista (Solo si es admin) */}
              {!isStaffView && staffList.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">
                    <User size={13} className="inline mr-1 text-rose-500" />
                    Asignar Especialista
                  </label>
                  <select
                    value={newStaffId}
                    onChange={(e) => setNewStaffId(e.target.value ? Number(e.target.value) : "")}
                    className="w-full rounded-[4px] border border-stone-200 px-3 py-2 text-sm bg-stone-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-400"
                  >
                    <option value="">Cualquier especialista disponible</option>
                    {staffList
                      .filter((s) => s.active)
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.role})
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {/* Alerta de Conflicto o Sin Horarios */}
              {slotError && (
                <div className="bg-amber-50 border border-amber-200 rounded-[4px] p-3 flex items-start gap-2.5 text-xs text-amber-800 animate-in fade-in">
                  <AlertTriangle size={16} className="shrink-0 text-amber-600 mt-0.5" />
                  <div className="leading-relaxed">
                    <p className="font-bold">Conflicto de disponibilidad:</p>
                    <p>{slotError} Por favor elige otra fecha o especialista.</p>
                  </div>
                </div>
              )}

              {/* Mensaje de WhatsApp preview */}
              <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-[4px] p-3.5 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                  <Image
                    src="/logos/logo-whatsapp.svg"
                    alt=""
                    width={14}
                    height={14}
                    className="shrink-0"
                  />
                  <span>Mensaje que se enviará al guardar:</span>
                </div>
                <p className="text-xs text-emerald-950 italic leading-relaxed bg-white/70 p-2.5 rounded-[4px] border border-emerald-100">
                  "{rescheduleMsg}"
                </p>
              </div>

              {/* Botón de acción */}
              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 px-4 rounded-[4px] border border-stone-200 text-stone-600 hover:bg-stone-50 text-xs font-bold transition-colors cursor-pointer"
                >
                  Volver
                </button>
                <button
                  type="button"
                  onClick={handleReschedule}
                  disabled={loading || loadingSlots || availableSlots.length === 0 || !availableSlots.includes(newTime)}
                  className="flex-[2] py-2.5 px-4 rounded-[4px] bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <>
                      <Image
                        src="/logos/logo-whatsapp.svg"
                        alt=""
                        width={15}
                        height={15}
                        className="shrink-0"
                      />
                      <span>Guardar y Proponer por WhatsApp</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* ========================================================= */
            /* PESTAÑA: CANCELAR                                         */
            /* ========================================================= */
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200/80 rounded-[4px] p-4 text-xs text-red-900 space-y-1.5">
                <p className="font-bold flex items-center gap-1.5 text-red-800">
                  <AlertTriangle size={15} />
                  ¿Seguro que deseas cancelar esta cita?
                </p>
                <p className="text-red-700 leading-relaxed">
                  El horario ({booking.date} a las {booking.time}) se liberará al instante en la web para que otras clientas puedan agendar.
                </p>
              </div>

              {/* Mensaje de WhatsApp preview */}
              <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-[4px] p-3.5 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                  <Image
                    src="/logos/logo-whatsapp.svg"
                    alt=""
                    width={14}
                    height={14}
                    className="shrink-0"
                  />
                  <span>Mensaje conversacional por WhatsApp:</span>
                </div>
                <p className="text-xs text-emerald-950 italic leading-relaxed bg-white/70 p-2.5 rounded-[4px] border border-emerald-100">
                  "{cancelMsg}"
                </p>
              </div>

              {/* Botón de acción */}
              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 px-4 rounded-[4px] border border-stone-200 text-stone-600 hover:bg-stone-50 text-xs font-bold transition-colors cursor-pointer"
                >
                  No cancelar
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={loading}
                  className="flex-[2] py-2.5 px-4 rounded-[4px] bg-red-600 hover:bg-red-700 text-white text-xs font-bold inline-flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <>
                      <Image
                        src="/logos/logo-whatsapp.svg"
                        alt=""
                        width={15}
                        height={15}
                        className="shrink-0"
                      />
                      <span>Cancelar Turno y Avisar por WhatsApp</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
