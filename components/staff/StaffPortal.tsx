"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Calendar,
  Check,
  Clock,
  LogOut,
  MessageCircle,
  Phone,
  RefreshCw,
  Sparkles,
  User,
} from "lucide-react";
import { addDays, toDateStr, waBookingMessage, waLink } from "@/lib/format";
import type { Booking, StaffMember } from "@/lib/types";
import ManageBookingModal from "@/components/admin/ManageBookingModal";
import StatusBadge from "@/components/admin/StatusBadge";
import { showToast } from "@/components/admin/toast";

interface StaffPortalProps {
  staff: StaffMember;
  currency: string;
  salonName: string;
}

export default function StaffPortal({
  staff,
  currency,
  salonName,
}: StaffPortalProps) {
  const router = useRouter();
  const [dateFilter, setDateFilter] = useState<"hoy" | "manana" | "todas">("hoy");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [managingBooking, setManagingBooking] = useState<Booking | null>(null);

  const todayStr = toDateStr(new Date());
  const tomorrowStr = addDays(todayStr, 1);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/staff/bookings");
      const data = await res.json();
      setBookings(data.bookings || []);
    } catch {
      showToast("Error al cargar tus citas.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  async function handleComplete(bookingId: number) {
    try {
      const res = await fetch(`/api/staff/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completada" }),
      });
      if (!res.ok) throw new Error();
      showToast("¡Turno marcado como completado! Buen trabajo ✨", "success");
      loadBookings();
    } catch {
      showToast("Error al completar el turno.", "error");
    }
  }

  async function handleLogout() {
    await fetch("/api/staff/logout", { method: "POST" });
    router.push("/staff/login");
    router.refresh();
  }

  const filteredBookings = bookings.filter((b) => {
    if (dateFilter === "hoy") return b.date === todayStr;
    if (dateFilter === "manana") return b.date === tomorrowStr;
    return true;
  });

  const todayCount = bookings.filter((b) => b.date === todayStr && b.status !== "cancelada").length;
  const completedCount = bookings.filter(
    (b) => b.date === todayStr && b.status === "completada"
  ).length;

  return (
    <div className="min-h-screen bg-stone-50 pb-16">
      {/* Header Superior Móvil */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-2xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-11 h-11 rounded-[4px] overflow-hidden bg-rose-100 border-2 border-rose-400 shrink-0 shadow-xs">
              {staff.avatar ? (
                <img src={staff.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="flex items-center justify-center h-full font-bold text-rose-700 text-sm">
                  {staff.name.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-bold text-stone-900 leading-tight">
                  Hola, {staff.name.split(" ")[0]}
                </h1>
                <Sparkles size={13} className="text-amber-500 fill-amber-400" />
              </div>
              <p className="text-[11px] text-stone-500 leading-tight">
                {staff.role || "Especialista"}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Cerrar sesión"
            className="p-2 rounded-[4px] text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Contenedor Principal */}
      <main className="max-w-2xl mx-auto px-4 pt-5 space-y-5">
        {/* Resumen de hoy */}
        <div className="bg-gradient-to-r from-stone-900 to-stone-850 text-white rounded-[4px] p-5 shadow-lg shadow-stone-900/10 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-rose-300 uppercase tracking-wider">
              Mi Agenda de Hoy
            </span>
            <p className="text-2xl font-black mt-0.5">
              {todayCount} {todayCount === 1 ? "turno" : "turnos"}
            </p>
            <p className="text-xs text-stone-400 mt-0.5">
              {completedCount} completados · {todayCount - completedCount} pendientes
            </p>
          </div>
          <div className="w-12 h-12 rounded-[4px] bg-white/10 flex items-center justify-center text-white">
            <Calendar size={22} />
          </div>
        </div>

        {/* Filtros de Fecha */}
        <div className="flex bg-stone-200/70 p-1 rounded-[4px] gap-1">
          <button
            onClick={() => setDateFilter("hoy")}
            className={`flex-1 py-2 text-xs font-bold rounded-[4px] transition-all cursor-pointer ${
              dateFilter === "hoy"
                ? "bg-white text-stone-900 shadow-xs"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            Hoy ({todayCount})
          </button>
          <button
            onClick={() => setDateFilter("manana")}
            className={`flex-1 py-2 text-xs font-bold rounded-[4px] transition-all cursor-pointer ${
              dateFilter === "manana"
                ? "bg-white text-stone-900 shadow-xs"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            Mañana
          </button>
          <button
            onClick={() => setDateFilter("todas")}
            className={`flex-1 py-2 text-xs font-bold rounded-[4px] transition-all cursor-pointer ${
              dateFilter === "todas"
                ? "bg-white text-stone-900 shadow-xs"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            Todas ({bookings.length})
          </button>
        </div>

        {/* Lista de Turnos */}
        {loading ? (
          <div className="py-20 text-center text-stone-400 space-y-2">
            <div className="w-6 h-6 border-2 border-stone-300 border-t-rose-500 rounded-[4px] animate-spin mx-auto" />
            <p className="text-xs">Cargando tus citas…</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="bg-white rounded-[4px] border border-dashed border-stone-200 p-8 text-center space-y-2">
            <div className="w-12 h-12 bg-stone-100 rounded-[4px] flex items-center justify-center mx-auto text-stone-400">
              <Calendar size={20} />
            </div>
            <p className="text-sm font-bold text-stone-700">No tienes citas programadas</p>
            <p className="text-xs text-stone-400 max-w-xs mx-auto">
              {dateFilter === "hoy"
                ? "¡No tienes turnos pendientes para hoy! Disfruta tu día ✨"
                : "No hay reservas registradas en este período."}
            </p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {filteredBookings.map((b) => (
              <div
                key={b.id}
                className="bg-white rounded-[4px] border border-stone-200/90 p-4 sm:p-5 shadow-xs hover:shadow-md transition-shadow space-y-3.5"
              >
                {/* Cabecera tarjeta: Hora y Estado */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-base text-stone-900 bg-stone-100 px-3 py-1 rounded-[4px]">
                      {b.time}
                    </span>
                    <span className="text-xs text-stone-400 font-medium">
                      {b.date}
                    </span>
                  </div>
                  <StatusBadge status={b.status} />
                </div>

                {/* Info del Cliente y Servicio */}
                <div className="space-y-1">
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-base font-bold text-stone-900">
                      {b.name}
                    </h3>
                    <span className="text-xs font-bold text-emerald-700">
                      {currency} {b.service_price}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-rose-600">
                    {b.service_name} · {b.service_duration} min
                  </p>
                  {b.notes && (
                    <p className="text-xs text-stone-500 italic bg-stone-50 p-2.5 rounded-[4px] border border-stone-100 mt-1">
                      "{b.notes}"
                    </p>
                  )}
                </div>

                {/* Botones de Acción */}
                <div className="pt-2 border-t border-stone-100 flex flex-wrap gap-2">
                  {/* WhatsApp */}
                  {b.phone && (
                    <a
                      href={waLink(b.phone, waBookingMessage(b))}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 inline-flex items-center justify-center gap-1.5 bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-bold py-2.5 px-3 rounded-[4px] transition-colors cursor-pointer shadow-xs"
                    >
                      <Image
                        src="/logos/logo-whatsapp.svg"
                        alt=""
                        width={14}
                        height={14}
                        className="shrink-0"
                      />
                      <span>WhatsApp</span>
                    </a>
                  )}

                  {/* Completar */}
                  {b.status !== "completada" && b.status !== "cancelada" && (
                    <button
                      onClick={() => handleComplete(b.id)}
                      className="inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 px-3.5 rounded-[4px] transition-colors cursor-pointer"
                    >
                      <Check size={14} />
                      <span>Completar</span>
                    </button>
                  )}

                  {/* Reagendar / Cancelar con WhatsApp */}
                  <button
                    onClick={() => setManagingBooking(b)}
                    className="inline-flex items-center justify-center gap-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold py-2.5 px-3 rounded-[4px] transition-colors cursor-pointer"
                  >
                    <RefreshCw size={13} className="text-rose-500" />
                    <span>Mover / Cancelar</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal Reagendar / Cancelar para Especialista */}
      {managingBooking && (
        <ManageBookingModal
          booking={managingBooking}
          salonName={salonName}
          currency={currency}
          isStaffView={true}
          onClose={() => setManagingBooking(null)}
          onSuccess={() => {
            loadBookings();
            setManagingBooking(null);
          }}
        />
      )}
    </div>
  );
}
