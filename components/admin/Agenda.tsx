"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  List,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import { addDays, toDateStr, waBookingMessage, waLink } from "@/lib/format";
import { STATUS_LABELS } from "@/lib/status";
import type { Booking, Service, StaffMember } from "@/lib/types";
import StatusBadge from "./StatusBadge";
import { showToast } from "./toast";
import ManageBookingModal from "./ManageBookingModal";
import PhoneInput from "@/components/PhoneInput";

const DAY_NAMES_SHORT = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const DAY_NAMES_FULL = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];
const MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const HOURS = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
];

function fullDateLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return `${DAY_NAMES_FULL[d.getDay()]} ${d.getDate()} de ${MONTH_NAMES[d.getMonth()].toLowerCase()}`;
}

function getWeekDays(referenceDate: string): string[] {
  const d = new Date(referenceDate + "T00:00:00");
  const day = d.getDay(); // 0 is Sunday
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = addDays(referenceDate, mondayOffset);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

export default function Agenda({ currency }: { currency: string }) {
  const [selectedDate, setSelectedDate] = useState(() => toDateStr(new Date()));
  const [miniCalMonth, setMiniCalMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [mainView, setMainView] = useState<"calendario" | "lista">("calendario");
  const [gridMode, setGridMode] = useState<"semana" | "dia">("semana");
  const [showCancelled, setShowCancelled] = useState(false);

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Modales
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);
  const [managingBooking, setManagingBooking] = useState<Booking | null>(null);
  const [newBookingModalOpen, setNewBookingModalOpen] = useState(false);
  const [savingBooking, setSavingBooking] = useState(false);

  // Formulario nueva reserva
  const [formServiceId, setFormServiceId] = useState<number | "">("");
  const [formStaffId, setFormStaffId] = useState<number | "">("");
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formDate, setFormDate] = useState(selectedDate);
  const [formTime, setFormTime] = useState("10:00");
  const [formNotes, setFormNotes] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const todayStr = toDateStr(new Date());

  // Cargar reservas
  const loadBookings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/bookings");
      const data = (await res.json()) as { bookings: Booking[] };
      setBookings(data.bookings || []);
    } catch {
      showToast("Error al cargar reservas.", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar servicios
  useEffect(() => {
    fetch("/api/admin/services")
      .then((r) => r.json())
      .then((data: { services: Service[] }) => {
        if (data.services) {
          setServices(data.services.filter((s) => s.active));
          if (data.services.length > 0 && !formServiceId) {
            setFormServiceId(data.services[0].id);
          }
        }
      })
      .catch(() => {});
  }, [formServiceId]);

  // Cargar profesionales/equipo
  useEffect(() => {
    fetch("/api/admin/staff")
      .then((r) => r.json())
      .then((data: { staff: StaffMember[] }) => {
        if (data.staff) {
          setStaffList(data.staff);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  // Cambiar estado de una reserva
  async function updateStatus(id: number, status: Booking["status"]) {
    try {
      await fetch(`/api/admin/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      showToast(
        `Reserva marcada como ${STATUS_LABELS[status as keyof typeof STATUS_LABELS]?.toLowerCase() || status}.`,
        "success"
      );
      if (activeBooking && activeBooking.id === id) {
        setActiveBooking({ ...activeBooking, status });
      }
      loadBookings();
    } catch {
      showToast("No se pudo actualizar el estado.", "error");
    }
  }

  // Eliminar reserva
  async function removeBooking(id: number) {
    try {
      await fetch(`/api/admin/bookings/${id}`, { method: "DELETE" });
      showToast("Reserva eliminada.", "success");
      setConfirmDeleteId(null);
      setActiveBooking(null);
      loadBookings();
    } catch {
      showToast("Error al eliminar.", "error");
    }
  }

  // Crear nueva reserva rápida desde admin
  async function handleCreateBooking(e: React.FormEvent) {
    e.preventDefault();
    const digitsOnly = formPhone.replace(/\D/g, "");
    if (!formServiceId || !formName.trim() || digitsOnly.length < 7 || !formDate || !formTime) {
      showToast("Completa los datos requeridos e ingresa un teléfono válido (mínimo 7 números).", "error");
      return;
    }
    setSavingBooking(true);
    try {
      const res = await fetch("/api/admin/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_id: formServiceId,
          staff_id: formStaffId ? Number(formStaffId) : undefined,
          name: formName.trim(),
          phone: formPhone.trim(),
          date: formDate,
          time: formTime,
          notes: formNotes.trim(),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al crear la reserva");
      }
      showToast("¡Turno agendado con éxito!", "success");
      setNewBookingModalOpen(false);
      setFormName("");
      setFormPhone("");
      setFormNotes("");
      setFormStaffId("");
      loadBookings();
    } catch (err: any) {
      showToast(err.message || "Error al guardar reserva.", "error");
    } finally {
      setSavingBooking(false);
    }
  }

  function openCreateModal(date: string, time: string, preselectedStaffId?: number | "") {
    setFormDate(date);
    setFormTime(time);
    setFormStaffId(preselectedStaffId ?? "");
    setNewBookingModalOpen(true);
  }

  // Días de la semana actual
  const weekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate]);

  // Reservas filtradas según vista
  const visibleBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (!showCancelled && b.status === "cancelada") return false;
      if (gridMode === "dia") {
        return b.date === selectedDate;
      }
      return weekDays.includes(b.date);
    });
  }, [bookings, selectedDate, gridMode, weekDays, showCancelled]);

  // Columnas para vista de Día (Especialistas / Staff)
  const dayColumns = useMemo(() => {
    if (gridMode !== "dia") return [];
    const active = staffList.filter((s) => s.active);
    if (active.length === 0) return [];
    const activeIds = new Set(active.map((s) => s.id));
    const hasUnassigned = visibleBookings.some(
      (b) => b.date === selectedDate && (!b.staff_id || !activeIds.has(b.staff_id))
    );
    if (hasUnassigned) {
      return [
        ...active,
        {
          id: 0,
          name: "Sin Asignar",
          role: "General",
          phone: "",
          avatar: "",
          active: 1,
          services: [],
        } as StaffMember,
      ];
    }
    return active;
  }, [gridMode, staffList, visibleBookings, selectedDate]);

  // Conteo de reservas
  const stats = useMemo(() => {
    const forDay = bookings.filter((b) => b.date === selectedDate);
    return {
      totalDay: forDay.length,
      pendientes: forDay.filter((b) => b.status === "pendiente").length,
      confirmadas: forDay.filter((b) => b.status === "confirmada").length,
      completadas: forDay.filter((b) => b.status === "completada").length,
      ingresosDay: forDay
        .filter((b) => b.status !== "cancelada")
        .reduce((sum, b) => sum + (Number(b.service_price) || 0), 0),
    };
  }, [bookings, selectedDate]);

  // Días que tienen reservas (para los puntitos en el mini calendario)
  const daysWithBookings = useMemo(() => {
    const map = new Map<string, number>();
    for (const b of bookings) {
      if (b.status !== "cancelada") {
        map.set(b.date, (map.get(b.date) || 0) + 1);
      }
    }
    return map;
  }, [bookings]);

  // Mini calendario: días del mes actual
  const miniCalDays = useMemo(() => {
    const year = miniCalMonth.getFullYear();
    const month = miniCalMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    let startDayOfWeek = firstDay.getDay();
    if (startDayOfWeek === 0) startDayOfWeek = 7;

    const days: { dateStr: string; dayNumber: number; currentMonth: boolean }[] = [];

    // Días del mes anterior
    for (let i = startDayOfWeek - 1; i > 0; i--) {
      const prevDate = new Date(year, month, 1 - i);
      days.push({
        dateStr: toDateStr(prevDate),
        dayNumber: prevDate.getDate(),
        currentMonth: false,
      });
    }

    // Días del mes actual
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const currDate = new Date(year, month, i);
      days.push({
        dateStr: toDateStr(currDate),
        dayNumber: i,
        currentMonth: true,
      });
    }

    // Rellenar hasta múltiplo de 7
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const nextDate = new Date(year, month + 1, i);
      days.push({
        dateStr: toDateStr(nextDate),
        dayNumber: i,
        currentMonth: false,
      });
    }

    return days;
  }, [miniCalMonth]);

  function getBookingCardStyle(status: string) {
    switch (status) {
      case "confirmada":
        return "bg-[#e8f5e9] text-[#1b5e20] border-[#c8e6c9] hover:border-[#81c784]";
      case "pendiente":
        return "bg-[#fff8e1] text-[#b78103] border-[#ffe082] hover:border-[#ffd54f]";
      case "completada":
        return "bg-[#e3f2fd] text-[#0d47a1] border-[#bbdefb] hover:border-[#90caf9]";
      case "cancelada":
        return "bg-stone-100 text-stone-600 border-stone-200 line-through opacity-60";
      default:
        return "bg-[#f3e5f5] text-[#4a148c] border-[#e1bee7]";
    }
  }

  function getStatusDotColor(status: string) {
    switch (status) {
      case "confirmada":
        return "bg-[#2e7d32]";
      case "pendiente":
        return "bg-[#f59e0b]";
      case "completada":
        return "bg-[#0284c7]";
      case "cancelada":
        return "bg-stone-400";
      default:
        return "bg-purple-600";
    }
  }

  return (
    <div className="space-y-4">
      {/* ========================================================= */}
      {/* 1. BARRA SUPERIOR DE LA AGENDA                             */}
      {/* ========================================================= */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-4 sm:p-5 rounded-[4px] border border-stone-200/80 shadow-xs">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">Agenda</h1>
          <p className="text-sm font-medium text-stone-500 capitalize">
            {fullDateLabel(selectedDate)}
          </p>
        </div>

        {/* Controles de vista y navegación */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Selector de modo: Calendario / Lista */}
          <div className="inline-flex bg-stone-100 p-1 rounded-[4px] border border-stone-200/60">
            <button
              onClick={() => setMainView("calendario")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-[4px] text-xs font-semibold transition-all cursor-pointer ${
                mainView === "calendario"
                  ? "bg-[#007356] text-white shadow-xs"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              <CalendarDays size={14} />
              <span>Calendario</span>
            </button>
            <button
              onClick={() => setMainView("lista")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-[4px] text-xs font-semibold transition-all cursor-pointer ${
                mainView === "lista"
                  ? "bg-[#007356] text-white shadow-xs"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              <List size={14} />
              <span>Lista</span>
            </button>
          </div>

          {/* Selector de rango: Semana / Día (solo en calendario) */}
          {mainView === "calendario" && (
            <div className="inline-flex bg-stone-100 p-1 rounded-[4px] border border-stone-200/60">
              <button
                onClick={() => setGridMode("semana")}
                className={`px-3 py-1.5 rounded-[4px] text-xs font-semibold transition-all cursor-pointer ${
                  gridMode === "semana"
                    ? "bg-white text-stone-900 shadow-xs"
                    : "text-stone-500 hover:text-stone-900"
                }`}
              >
                Semana
              </button>
              <button
                onClick={() => setGridMode("dia")}
                className={`px-3 py-1.5 rounded-[4px] text-xs font-semibold transition-all cursor-pointer ${
                  gridMode === "dia"
                    ? "bg-white text-stone-900 shadow-xs"
                    : "text-stone-500 hover:text-stone-900"
                }`}
              >
                Día
              </button>
            </div>
          )}

          {/* Navegación temporal (< Hoy >) */}
          <div className="flex items-center bg-stone-100 rounded-[4px] p-1 border border-stone-200/60">
            <button
              onClick={() => {
                const diff = gridMode === "semana" ? -7 : -1;
                setSelectedDate(addDays(selectedDate, diff));
              }}
              aria-label="Anterior"
              className="p-1.5 hover:bg-white rounded-[4px] text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setSelectedDate(todayStr)}
              className="px-3 py-1 text-xs font-semibold text-stone-700 hover:text-stone-900 cursor-pointer"
            >
              Hoy
            </button>
            <button
              onClick={() => {
                const diff = gridMode === "semana" ? 7 : 1;
                setSelectedDate(addDays(selectedDate, diff));
              }}
              aria-label="Siguiente"
              className="p-1.5 hover:bg-white rounded-[4px] text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Botón principal "+ Cargar turno" */}
          <button
            onClick={() => openCreateModal(selectedDate, "10:00")}
            className="inline-flex items-center gap-2 bg-[#007356] hover:bg-[#005c44] text-white text-xs font-semibold px-4 py-2.5 rounded-[4px] shadow-sm transition-colors cursor-pointer"
          >
            <Plus size={16} />
            <span>+ Cargar turno</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. SUB-BARRA DE LEYENDAS Y FILTROS                        */}
      {/* ========================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white/70 backdrop-blur-xs px-4 py-2.5 rounded-[4px] border border-stone-200/70 text-xs text-stone-600">
        <div className="flex flex-wrap items-center gap-4">
          <p className="font-medium text-stone-700">
            <span className="font-bold text-stone-900">{visibleBookings.length}</span> turnos en
            agenda ·{" "}
            <span className="text-stone-500 hidden sm:inline">
              Toca un hueco libre para agendar
            </span>
          </p>
          <div className="h-4 w-px bg-stone-300 hidden sm:block" />
          {/* Leyenda de estados */}
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-[4px] bg-[#2e7d32]" /> Confirmada
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-[4px] bg-[#f59e0b]" /> Pendiente
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-[4px] bg-[#0284c7]" /> Completada
            </span>
            <span className="inline-flex items-center gap-1.5 text-stone-600">
              <span className="w-2.5 h-2.5 rounded-[4px] bg-stone-400" /> Cancelada
            </span>
          </div>
        </div>

        <label className="inline-flex items-center gap-2 cursor-pointer select-none text-stone-600 hover:text-stone-900">
          <input
            type="checkbox"
            checked={showCancelled}
            onChange={(e) => setShowCancelled(e.target.checked)}
            className="rounded-[4px] text-[#007356] focus:ring-[#007356] w-3.5 h-3.5"
          />
          <span>Ver cancelados</span>
        </label>
      </div>

      {/* ========================================================= */}
      {/* 3. CONTENIDO PRINCIPAL: GRILLA + MINI-CALENDARIO LATERAL  */}
      {/* ========================================================= */}
      <div className="flex flex-col xl:flex-row gap-5 items-start">
        {/* ======================================================= */}
        {/* COLUMNA IZQUIERDA: CALENDARIO PRINCIPAL (FULL WIDTH)    */}
        {/* ======================================================= */}
        <div className="flex-1 min-w-0 w-full bg-white rounded-[4px] border border-stone-200/80 shadow-xs overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 text-stone-400">
              <Loader2 className="animate-spin text-[#007356] mb-3" size={32} />
              <p className="text-sm">Cargando agenda…</p>
            </div>
          ) : mainView === "lista" ? (
            /* VISTA LISTA ALTERNATIVA */
            <div className="p-4 sm:p-6">
              {visibleBookings.length === 0 ? (
                <div className="text-center py-20 text-stone-400">
                  <p className="text-base font-medium">No hay reservas para mostrar</p>
                  <p className="text-xs text-stone-500 mt-1">
                    Toca en "+ Cargar turno" para agregar una reserva.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-stone-200 text-stone-500 text-xs uppercase tracking-wider">
                        <th className="pb-3 font-semibold">Hora</th>
                        <th className="pb-3 font-semibold">Cliente</th>
                        <th className="pb-3 font-semibold">Servicio</th>
                        <th className="pb-3 font-semibold">Especialista</th>
                        <th className="pb-3 font-semibold">Duración</th>
                        <th className="pb-3 font-semibold">Precio</th>
                        <th className="pb-3 font-semibold">Estado</th>
                        <th className="pb-3 font-semibold text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {visibleBookings.map((b) => (
                        <tr
                          key={b.id}
                          onClick={() => setActiveBooking(b)}
                          className="hover:bg-stone-50/80 cursor-pointer transition-colors"
                        >
                          <td className="py-3.5 font-bold text-stone-900">{b.time}</td>
                          <td className="py-3.5">
                            <p className="font-semibold text-stone-800">{b.name}</p>
                            <p className="text-xs text-stone-500">{b.phone}</p>
                          </td>
                          <td className="py-3.5 text-stone-600">{b.service_name}</td>
                          <td className="py-3.5 text-stone-600 text-xs">
                            {b.staff_name ? (
                              <span className="inline-flex items-center gap-1 font-medium text-stone-700 bg-stone-100 px-2 py-0.5 rounded-[4px]">
                                👤 {b.staff_name}
                              </span>
                            ) : (
                              <span className="text-stone-400 italic">Sin asignar</span>
                            )}
                          </td>
                          <td className="py-3.5 text-stone-500 text-xs">
                            {b.service_duration} min
                          </td>
                          <td className="py-3.5 font-medium text-stone-900">
                            {currency} {b.service_price}
                          </td>
                          <td className="py-3.5">
                            <StatusBadge status={b.status} />
                          </td>
                          <td className="py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                            {b.phone && (
                              <a
                                href={waLink(b.phone, waBookingMessage(b))}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-[4px] transition-colors"
                              >
                                WhatsApp
                              </a>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            /* ===================================================== */
            /* VISTA CALENDARIO CON GRILLA HORARIA (SEMANA / DÍA)   */
            /* ===================================================== */
            <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div
                style={{
                  minWidth:
                    gridMode === "semana"
                      ? "760px"
                      : `${Math.max(640, 70 + (dayColumns.length || 1) * 200)}px`,
                }}
              >
                {/* Cabecera de columnas */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      gridMode === "semana"
                        ? "70px repeat(7, minmax(0, 1fr))"
                        : dayColumns.length > 0
                          ? `70px repeat(${dayColumns.length}, minmax(180px, 1fr))`
                          : "70px minmax(0, 1fr)",
                  }}
                  className="border-b border-stone-200 bg-stone-50/80 sticky top-0 z-10"
                >
                  <div className="p-3 text-center text-xs font-bold text-stone-600 border-r border-stone-200">
                    Hora
                  </div>

                  {gridMode === "dia" && dayColumns.length > 0 ? (
                    dayColumns.map((staff) => (
                      <div
                        key={staff.id}
                        className="p-3 text-center border-r border-stone-200 bg-stone-50/90 flex items-center justify-center gap-2.5"
                      >
                        <div className="w-8 h-8 rounded-[4px] bg-emerald-100 text-[#007356] font-bold text-xs flex items-center justify-center overflow-hidden shrink-0 border border-emerald-200/80">
                          {staff.avatar ? (
                            <img
                              src={staff.avatar}
                              alt={staff.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            staff.name.slice(0, 2).toUpperCase()
                          )}
                        </div>
                        <div className="text-left min-w-0">
                          <p className="text-xs font-bold text-stone-900 truncate leading-tight">
                            {staff.name}
                          </p>
                          <p className="text-[10px] font-medium text-stone-500 truncate leading-tight">
                            {staff.role || "Especialista"}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    (gridMode === "semana" ? weekDays : [selectedDate]).map((d) => {
                      const isToday = d === todayStr;
                      const isSelected = d === selectedDate;
                      const dateObj = new Date(d + "T00:00:00");
                      const dayName = DAY_NAMES_SHORT[dateObj.getDay()];
                      const dayNum = dateObj.getDate();

                      return (
                        <button
                          key={d}
                          onClick={() => setSelectedDate(d)}
                          className={`p-3 text-center border-r border-stone-200 transition-colors cursor-pointer ${
                            isSelected ? "bg-emerald-50/60" : "hover:bg-stone-100/60"
                          }`}
                        >
                          <p className="text-[11px] font-semibold text-stone-500 uppercase">
                            {dayName}
                          </p>
                          <p
                            className={`text-base font-bold inline-flex items-center justify-center w-7 h-7 rounded-[4px] mt-0.5 ${
                              isToday
                                ? "bg-[#007356] text-white"
                                : isSelected
                                  ? "bg-stone-800 text-white"
                                  : "text-stone-800"
                            }`}
                          >
                            {dayNum}
                          </p>
                        </button>
                      );
                    })
                  )}
                </div>

                {/* Filas de horas y huecos libres con turnos ubicados */}
                <div className="divide-y divide-stone-100">
                  {HOURS.map((hour) => {
                    const hourNum = parseInt(hour.split(":")[0], 10);
                    const isStaffDayView = gridMode === "dia" && dayColumns.length > 0;

                    return (
                      <div
                        key={hour}
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            gridMode === "semana"
                              ? "70px repeat(7, minmax(0, 1fr))"
                              : dayColumns.length > 0
                                ? `70px repeat(${dayColumns.length}, minmax(180px, 1fr))`
                                : "70px minmax(0, 1fr)",
                        }}
                        className="min-h-[78px] group"
                      >
                        {/* Etiqueta de hora en el eje izquierdo */}
                        <div className="p-2.5 text-center text-xs font-semibold text-stone-600 border-r border-stone-200 bg-stone-50/30 select-none">
                          {hour}
                        </div>

                        {/* Columnas: Si es vista Día con especialistas, mapear dayColumns */}
                        {isStaffDayView ? (
                          dayColumns.map((staffCol) => {
                            const cellBookings = visibleBookings.filter((b) => {
                              if (b.date !== selectedDate) return false;
                              const [bH] = b.time.split(":").map(Number);
                              if (bH !== hourNum) return false;
                              if (staffCol.id === 0) {
                                return (
                                  !b.staff_id ||
                                  !staffList.some((s) => s.id === b.staff_id && s.active)
                                );
                              }
                              return b.staff_id === staffCol.id;
                            });

                            return (
                              <div
                                key={staffCol.id}
                                onClick={() =>
                                  openCreateModal(
                                    selectedDate,
                                    hour,
                                    staffCol.id !== 0 ? staffCol.id : ""
                                  )
                                }
                                className="border-r border-stone-200 p-1.5 relative hover:bg-stone-50/80 transition-colors cursor-pointer group/cell flex flex-col gap-1.5"
                              >
                                {cellBookings.length === 0 && (
                                  <div className="absolute inset-0 opacity-0 group-hover/cell:opacity-100 flex items-center justify-center pointer-events-none transition-opacity">
                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#007356] bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-[4px] shadow-2xs">
                                      <Plus size={12} />
                                      <span>Agendar</span>
                                    </span>
                                  </div>
                                )}

                                {cellBookings.map((b) => {
                                  const cardStyle = getBookingCardStyle(b.status);
                                  const dotColor = getStatusDotColor(b.status);

                                  return (
                                    <div
                                      key={b.id}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveBooking(b);
                                      }}
                                      className={`rounded-[4px] border p-2 shadow-2xs transition-transform hover:-translate-y-0.5 hover:shadow-xs cursor-pointer ${cardStyle}`}
                                    >
                                      <div className="flex items-center justify-between gap-1 mb-1">
                                        <span className="text-[10px] font-extrabold uppercase tracking-wide inline-flex items-center gap-1">
                                          <span className={`w-1.5 h-1.5 rounded-[4px] ${dotColor}`} />
                                          {b.time}
                                        </span>
                                        <span className="text-[10px] opacity-75 font-semibold">
                                          {b.service_duration}m
                                        </span>
                                      </div>
                                      <p className="text-xs font-bold truncate leading-tight">
                                        {b.name}
                                      </p>
                                      <p className="text-[11px] opacity-90 truncate leading-tight mt-0.5">
                                        {b.service_name}
                                      </p>
                                      {typeof b.service_price === "number" && (
                                        <p className="text-[10px] font-semibold mt-1 opacity-80">
                                          {currency} {b.service_price}
                                        </p>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })
                        ) : (
                          (gridMode === "semana" ? weekDays : [selectedDate]).map((colDate) => {
                            const cellBookings = visibleBookings.filter((b) => {
                              if (b.date !== colDate) return false;
                              const [bH] = b.time.split(":").map(Number);
                              return bH === hourNum;
                            });

                            return (
                              <div
                                key={colDate}
                                onClick={() => openCreateModal(colDate, hour)}
                                className="border-r border-stone-200 p-1.5 relative hover:bg-stone-50/80 transition-colors cursor-pointer group/cell flex flex-col gap-1.5"
                              >
                                {cellBookings.length === 0 && (
                                  <div className="absolute inset-0 opacity-0 group-hover/cell:opacity-100 flex items-center justify-center pointer-events-none transition-opacity">
                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#007356] bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-[4px] shadow-2xs">
                                      <Plus size={12} />
                                      <span>Agendar</span>
                                    </span>
                                  </div>
                                )}

                                {cellBookings.map((b) => {
                                  const cardStyle = getBookingCardStyle(b.status);
                                  const dotColor = getStatusDotColor(b.status);

                                  return (
                                    <div
                                      key={b.id}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveBooking(b);
                                      }}
                                      className={`rounded-[4px] border p-2 shadow-2xs transition-transform hover:-translate-y-0.5 hover:shadow-xs cursor-pointer ${cardStyle}`}
                                    >
                                      <div className="flex items-center justify-between gap-1 mb-1">
                                        <span className="text-[10px] font-extrabold uppercase tracking-wide inline-flex items-center gap-1">
                                          <span className={`w-1.5 h-1.5 rounded-[4px] ${dotColor}`} />
                                          {b.time}
                                        </span>
                                        <span className="text-[10px] opacity-75 font-semibold">
                                          {b.service_duration}m
                                        </span>
                                      </div>
                                      <p className="text-xs font-bold truncate leading-tight">
                                        {b.name}
                                      </p>
                                      <p className="text-[11px] opacity-90 truncate leading-tight mt-0.5">
                                        {b.service_name}
                                      </p>
                                      {b.staff_name && (
                                        <p className="text-[10px] opacity-80 truncate leading-tight mt-0.5 font-medium">
                                          👤 {b.staff_name}
                                        </p>
                                      )}
                                      {typeof b.service_price === "number" && (
                                        <p className="text-[10px] font-semibold mt-1 opacity-80">
                                          {currency} {b.service_price}
                                        </p>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ======================================================= */}
        {/* COLUMNA DERECHA: MINI CALENDARIO INTERACTIVO (WIDGET)   */}
        {/* ======================================================= */}
        <aside className="w-full xl:w-80 shrink-0 space-y-4">
          {/* Tarjeta del Mini Calendario */}
          <div className="bg-white rounded-[4px] border border-stone-200/80 p-5 shadow-xs">
            {/* Cabecera del mes con navegación */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-stone-800 capitalize">
                {MONTH_NAMES[miniCalMonth.getMonth()]} {miniCalMonth.getFullYear()}
              </h2>
              <div className="flex items-center gap-1">
                <button
                  onClick={() =>
                    setMiniCalMonth(
                      new Date(miniCalMonth.getFullYear(), miniCalMonth.getMonth() - 1, 1)
                    )
                  }
                  aria-label="Mes anterior"
                  className="p-1 rounded-[4px] text-stone-400 hover:text-stone-800 hover:bg-stone-100 transition-colors cursor-pointer"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() =>
                    setMiniCalMonth(
                      new Date(miniCalMonth.getFullYear(), miniCalMonth.getMonth() + 1, 1)
                    )
                  }
                  aria-label="Mes siguiente"
                  className="p-1 rounded-[4px] text-stone-400 hover:text-stone-800 hover:bg-stone-100 transition-colors cursor-pointer"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Días de la semana L M M J V S D */}
            <div className="grid grid-cols-7 text-center text-[11px] font-bold text-stone-600 mb-2">
              <span>L</span>
              <span>M</span>
              <span>M</span>
              <span>J</span>
              <span>V</span>
              <span>S</span>
              <span>D</span>
            </div>

            {/* Cuadrícula de días */}
            <div className="grid grid-cols-7 gap-y-1 text-center text-xs">
              {miniCalDays.map((item, idx) => {
                const isSelected = item.dateStr === selectedDate;
                const isToday = item.dateStr === todayStr;
                const hasBookings = daysWithBookings.has(item.dateStr);

                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedDate(item.dateStr)}
                    className={`relative py-2 rounded-[4px] font-medium transition-all flex flex-col items-center justify-center cursor-pointer ${
                      !item.currentMonth
                        ? "text-stone-600 opacity-60"
                        : isSelected
                          ? "bg-[#007356] text-white font-bold shadow-xs scale-105"
                          : isToday
                            ? "border border-[#007356] text-[#007356] font-bold hover:bg-emerald-50"
                            : "text-stone-700 hover:bg-stone-100"
                    }`}
                  >
                    <span>{item.dayNumber}</span>
                    {hasBookings && !isSelected && (
                      <span className="w-1 h-1 rounded-[4px] bg-[#007356] mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tarjeta de Resumen Rápido del Día */}
          <div className="bg-white rounded-[4px] border border-stone-200/80 p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-600">
              Resumen del Día
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-stone-50 rounded-[4px] p-3 border border-stone-100">
                <p className="text-xl font-extrabold text-stone-900">{stats.totalDay}</p>
                <p className="text-[11px] font-medium text-stone-500">Citas agendadas</p>
              </div>
              <div className="bg-emerald-50 rounded-[4px] p-3 border border-emerald-100">
                <p className="text-xl font-extrabold text-emerald-800">
                  {currency} {stats.ingresosDay}
                </p>
                <p className="text-[11px] font-medium text-emerald-700">Ingresos est.</p>
              </div>
            </div>

            <div className="space-y-2 pt-1 border-t border-stone-100 text-xs">
              <div className="flex justify-between items-center py-1">
                <span className="text-stone-500">Confirmadas</span>
                <span className="font-bold text-emerald-700">{stats.confirmadas}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-stone-500">Pendientes</span>
                <span className="font-bold text-amber-600">{stats.pendientes}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-stone-500">Completadas</span>
                <span className="font-bold text-sky-700">{stats.completadas}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* ========================================================= */}
      {/* 4. MODAL DETALLES DE RESERVA Y ACCIONES RÁPIDAS            */}
      {/* ========================================================= */}
      {activeBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs">
          <div
            className="bg-white rounded-[4px] border border-stone-200 shadow-2xl max-w-md w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header modal */}
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold text-stone-600 uppercase tracking-wide">
                  Detalle del turno
                </span>
                <h3 className="text-xl font-bold text-stone-900 mt-0.5">
                  {activeBooking.name}
                </h3>
              </div>
              <button
                onClick={() => setActiveBooking(null)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-[4px] hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Datos de la cita */}
            <div className="space-y-2.5 bg-stone-50 rounded-[4px] p-4 border border-stone-100 text-sm">
              <div className="flex justify-between">
                <span className="text-stone-500">Servicio:</span>
                <span className="font-bold text-stone-800">{activeBooking.service_name}</span>
              </div>
              {activeBooking.staff_name && (
                <div className="flex justify-between">
                  <span className="text-stone-500">Especialista:</span>
                  <span className="font-semibold text-stone-800 flex items-center gap-1">
                    <span className="text-xs">👤</span> {activeBooking.staff_name}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-stone-500">Fecha y hora:</span>
                <span className="font-semibold text-stone-800">
                  {activeBooking.date} a las {activeBooking.time}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Duración estimada:</span>
                <span className="font-semibold text-stone-800">
                  {activeBooking.service_duration} minutos
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Precio:</span>
                <span className="font-bold text-emerald-700">
                  {currency} {activeBooking.service_price}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-stone-200">
                <span className="text-stone-500">Estado actual:</span>
                <StatusBadge status={activeBooking.status} />
              </div>
              {activeBooking.notes && (
                <div className="pt-2 border-t border-stone-200">
                  <p className="text-xs text-stone-500 font-medium mb-1">Notas del cliente:</p>
                  <p className="text-xs bg-white p-2.5 rounded-[4px] border border-stone-200 text-stone-700 italic">
                    "{activeBooking.notes}"
                  </p>
                </div>
              )}
            </div>

            {/* Acciones y cambio de estado */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                Cambiar estado
              </p>
              <div className="grid grid-cols-2 gap-2">
                {activeBooking.status !== "confirmada" && (
                  <button
                    onClick={() => updateStatus(activeBooking.id, "confirmada")}
                    className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-2.5 px-3 rounded-[4px] transition-colors cursor-pointer"
                  >
                    <Check size={14} />
                    <span>Confirmar</span>
                  </button>
                )}
                {activeBooking.status !== "completada" && (
                  <button
                    onClick={() => updateStatus(activeBooking.id, "completada")}
                    className="flex items-center justify-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold py-2.5 px-3 rounded-[4px] transition-colors cursor-pointer"
                  >
                    <span>Completar</span>
                  </button>
                )}
                {activeBooking.status !== "pendiente" && (
                  <button
                    onClick={() => updateStatus(activeBooking.id, "pendiente")}
                    className="flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold py-2.5 px-3 rounded-[4px] transition-colors cursor-pointer"
                  >
                    <span>Pendiente</span>
                  </button>
                )}
                {activeBooking.status !== "cancelada" && (
                  <button
                    onClick={() => updateStatus(activeBooking.id, "cancelada")}
                    className="flex items-center justify-center gap-1.5 border border-red-300 text-red-600 hover:bg-red-50 text-xs font-semibold py-2.5 px-3 rounded-[4px] transition-colors cursor-pointer"
                  >
                    <span>Cancelar</span>
                  </button>
                )}
              </div>

              {/* Botón Reagendar o Cancelar con WhatsApp */}
              <button
                type="button"
                onClick={() => {
                  const b = activeBooking;
                  setActiveBooking(null);
                  setManagingBooking(b);
                }}
                className="w-full inline-flex items-center justify-center gap-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold py-2.5 rounded-[4px] transition-all cursor-pointer shadow-xs"
              >
                <RefreshCw size={14} className="text-rose-400" />
                <span>Reagendar o Cancelar con WhatsApp</span>
              </button>

              {/* Botón WhatsApp */}
              {activeBooking.phone && (
                <a
                  href={waLink(activeBooking.phone, waBookingMessage(activeBooking))}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1EBE5D] text-white text-sm font-semibold py-2.5 rounded-[4px] transition-colors cursor-pointer shadow-xs"
                >
                  <Image
                    src="/logos/logo-whatsapp.svg"
                    alt=""
                    width={16}
                    height={16}
                    className="shrink-0"
                  />
                  <span>Enviar mensaje por WhatsApp</span>
                </a>
              )}

              {/* Eliminar cita */}
              <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                {confirmDeleteId === activeBooking.id ? (
                  <div className="flex items-center gap-2 w-full justify-between">
                    <span className="text-xs text-red-600 font-semibold">¿Seguro de borrar?</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => removeBooking(activeBooking.id)}
                        className="text-xs bg-red-600 text-white px-3 py-1.5 rounded-[4px] font-bold cursor-pointer"
                      >
                        Sí, eliminar
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="text-xs border border-stone-300 text-stone-600 px-2.5 py-1.5 rounded-[4px] cursor-pointer"
                      >
                        No
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDeleteId(activeBooking.id)}
                    className="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-red-600 transition-colors cursor-pointer"
                  >
                    <Trash2 size={14} />
                    <span>Eliminar turno definitivamente</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. MODAL: NUEVA RESERVA RÁPIDA (+ CARGAR TURNO)            */}
      {/* ========================================================= */}
      {newBookingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs">
          <div
            className="bg-white rounded-[4px] border border-stone-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold text-[#007356] uppercase tracking-wide">
                  Panel de recepción
                </span>
                <h3 className="text-xl font-bold text-stone-900 mt-0.5">+ Cargar nuevo turno</h3>
              </div>
              <button
                onClick={() => setNewBookingModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-[4px] hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateBooking} className="space-y-3.5">
              {/* Servicio */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Servicio a realizar *
                </label>
                <select
                  value={formServiceId}
                  onChange={(e) => setFormServiceId(Number(e.target.value))}
                  required
                  className="w-full rounded-[4px] border border-stone-300 px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#007356]"
                >
                  <option value="" disabled>
                    Selecciona un servicio
                  </option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.duration_minutes} min - {currency} {s.price})
                    </option>
                  ))}
                </select>
              </div>

              {/* Especialista asignado */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Especialista asignado (opcional)
                </label>
                <select
                  value={formStaffId}
                  onChange={(e) => setFormStaffId(e.target.value ? Number(e.target.value) : "")}
                  className="w-full rounded-[4px] border border-stone-300 px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#007356]"
                >
                  <option value="">Cualquiera disponible / Autoasignar</option>
                  {staffList
                    .filter((s) => s.active)
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.role})
                      </option>
                    ))}
                </select>
              </div>

              {/* Nombre cliente */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Nombre del cliente *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Camila Morales"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full rounded-[4px] border border-stone-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#007356]"
                />
              </div>

              {/* Teléfono */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center justify-between">
                  <span>Teléfono / WhatsApp *</span>
                  <span className="text-[11px] text-stone-400 font-normal">Solo números</span>
                </label>
                <PhoneInput
                  value={formPhone}
                  onChange={(val) => setFormPhone(val)}
                  variant="admin"
                  placeholder="71234567"
                  required
                />
              </div>

              {/* Fecha y Hora */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Fecha *</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full rounded-[4px] border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#007356]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Hora *</label>
                  <input
                    type="time"
                    required
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    className="w-full rounded-[4px] border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#007356]"
                  />
                </div>
              </div>

              {/* Observaciones */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Notas / Observaciones
                </label>
                <textarea
                  rows={2}
                  placeholder="Detalles sobre tintura, corte o preferencia..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full rounded-[4px] border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#007356] resize-none"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setNewBookingModalOpen(false)}
                  className="flex-1 border border-stone-300 hover:bg-stone-100 text-stone-700 font-semibold py-2.5 rounded-[4px] text-sm transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingBooking}
                  className="flex-1 bg-[#007356] hover:bg-[#005c44] disabled:opacity-50 text-white font-semibold py-2.5 rounded-[4px] text-sm transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  {savingBooking ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Guardando…</span>
                    </>
                  ) : (
                    <span>Guardar turno</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL GESTIONAR / REAGENDAR CITA */}
      {managingBooking && (
        <ManageBookingModal
          booking={managingBooking}
          currency={currency}
          staffList={staffList}
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