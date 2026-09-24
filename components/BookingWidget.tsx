"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Loader2,
  Sparkles,
  User,
  Users,
} from "lucide-react";
import { formatPrice } from "@/lib/format";
import type { Service, StaffMember } from "@/lib/types";
import MonthCalendar from "./MonthCalendar";
import PhoneInput from "./PhoneInput";

type Step = "service" | "staff" | "schedule" | "details" | "done";

type Props = {
  services: Service[];
  currency: string;
  initialService?: Service | null;
  initialPromotionId?: number | null;
  initialStaffId?: number | null;
  hours?: Record<string, string | null>;
  salonName?: string;
  staff?: StaffMember[];
  onClose?: () => void;
};

const DAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTH_NAMES = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

function dateLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return `${DAY_NAMES[d.getDay()]} ${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`;
}

export default function BookingWidget({
  services,
  currency,
  initialService = null,
  initialPromotionId = null,
  initialStaffId = null,
  hours = {},
  salonName = "Nuestro salón",
  staff = [],
  onClose,
}: Props) {
  const [step, setStep] = useState<Step>(initialService ? "staff" : "service");
  const [service, setService] = useState<Service | null>(initialService);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(() => {
    if (initialStaffId && staff && staff.length > 0) {
      return staff.find((m) => m.id === Number(initialStaffId)) ?? null;
    }
    return null;
  });
  const [availableStaff, setAvailableStaff] = useState<StaffMember[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);

  const [activePromo, setActivePromo] = useState<import("@/lib/types").Promotion | null>(null);
  const [promoApplied, setPromoApplied] = useState(true);

  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<{
    name: string;
    date: string;
    time: string;
    service: string;
    staffName?: string;
    discountApplied?: number;
  } | null>(null);
  const requestId = useRef(0);

  // Cargar promoción activa
  useEffect(() => {
    fetch("/api/promotions/active")
      .then((r) => r.json())
      .then((data: { promo: import("@/lib/types").Promotion | null }) => {
        if (data.promo) {
          setActivePromo(data.promo);
          // Si nos pasaron un servicio inicial que coincide, o si venimos con initialPromotionId
          if (initialPromotionId && data.promo.id === initialPromotionId) {
            setPromoApplied(true);
          }
        }
      })
      .catch(() => {});
  }, [initialPromotionId]);

  // Cargar especialista inicial si viene especificado desde el lookbook del equipo
  useEffect(() => {
    if (initialStaffId) {
      fetch("/api/staff")
        .then((r) => r.json())
        .then((data: { staff: StaffMember[] }) => {
          const found = (data.staff || []).find((m) => m.id === Number(initialStaffId));
          if (found) {
            setSelectedStaff(found);
          }
        })
        .catch(() => {});
    }
  }, [initialStaffId]);

  const closedDays = new Set(
    Object.entries(hours)
      .filter(([, v]) => !v)
      .map(([k]) => Number(k))
  );

  // Cargar especialistas calificados para un servicio
  function loadStaffForService(s: Service, targetStaffId?: number | null) {
    setLoadingStaff(true);
    fetch(`/api/staff?serviceId=${s.id}`)
      .then((r) => r.json())
      .then((data: { staff: StaffMember[] }) => {
        const list = data.staff || [];
        setAvailableStaff(list);

        const checkId = targetStaffId ?? selectedStaff?.id ?? initialStaffId;
        const matching = checkId ? list.find((m) => m.id === Number(checkId)) : null;

        if (matching) {
          setSelectedStaff(matching);
          setStep("schedule");
        } else if (list.length === 1) {
          // Si solo hay un especialista asignado para este servicio, lo preseleccionamos
          setSelectedStaff(list[0]);
          setStep("schedule");
        } else {
          setSelectedStaff(null);
          setStep("staff");
        }
      })
      .catch(() => {
        setAvailableStaff([]);
        setSelectedStaff(null);
        setStep("staff");
      })
      .finally(() => {
        setLoadingStaff(false);
      });
  }

  // Al seleccionar un servicio desde la lista
  function handleSelectService(s: Service) {
    setService(s);
    setDate(null);
    setTime(null);
    loadStaffForService(s, selectedStaff?.id ?? initialStaffId);
  }

  // Si se abrió directamente con un servicio inicial, cargar de inmediato sus especialistas
  useEffect(() => {
    if (initialService) {
      loadStaffForService(initialService, initialStaffId);
    }
  }, [initialService, initialStaffId]);

  // Cargar horarios según fecha, servicio y especialista seleccionado
  useEffect(() => {
    if (!service || !date) return;
    const id = ++requestId.current;
    setLoadingSlots(true);

    const staffParam = selectedStaff ? `&staffId=${selectedStaff.id}` : "&staffId=any";
    fetch(`/api/slots?date=${date}&serviceId=${service.id}${staffParam}`)
      .then((r) => r.json())
      .then((data: { slots: string[] }) => {
        if (requestId.current === id) setSlots(data.slots || []);
      })
      .catch(() => {
        if (requestId.current === id) setSlots([]);
      })
      .finally(() => {
        if (requestId.current === id) setLoadingSlots(false);
      });
  }, [service, date, selectedStaff]);

  const currentPromo =
    activePromo &&
    promoApplied &&
    service &&
    (!activePromo.service_id || Number(activePromo.service_id) === Number(service.id))
      ? activePromo
      : null;

  async function submit() {
    if (!service || !date || !time) return;
    const digitsOnly = phone.replace(/\D/g, "");
    if (!name.trim() || digitsOnly.length < 7) {
      setError("Por favor escribe tu nombre y un número de WhatsApp válido (mínimo 7 dígitos).");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: service.id,
          staffId: selectedStaff?.id ?? null,
          promotionId: currentPromo ? currentPromo.id : null,
          date,
          time,
          name,
          phone,
          notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo completar la reserva.");
        setSubmitting(false);
        return;
      }
      setDone({
        name,
        date,
        time,
        service: service.name,
        staffName: selectedStaff?.name,
        discountApplied: data.discount_applied ?? (currentPromo ? Math.round((service.price * currentPromo.discount) / 100) : 0),
      });
      setStep("done");
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    }
    setSubmitting(false);
  }

  if (step === "done" && done) {
    return (
      <div className="bg-white rounded-[4px] border border-stone-200 p-8 md:p-14 text-center shadow-lg shadow-ink/5">
        <CheckCircle2 className="mx-auto text-accent mb-5" size={52} strokeWidth={1.5} />
        <h3 className="font-serif text-3xl text-ink mb-3">
          ¡Reserva confirmada, {done.name.split(" ")[0]}!
        </h3>
        <p className="text-stone-500 font-light mb-8 max-w-sm mx-auto">
          Te esperamos el <strong className="text-ink font-medium">{dateLabel(done.date)}</strong> a
          las <strong className="text-ink font-medium">{done.time}</strong> para tu cita de{" "}
          <strong className="text-ink font-medium">{done.service}</strong>
          {done.staffName ? (
            <>
              {" "}con <strong className="text-ink font-medium">{done.staffName}</strong>.
            </>
          ) : (
            "."
          )}
          {done.discountApplied && done.discountApplied > 0 ? (
            <span className="block mt-2 font-medium text-emerald-800">
              Descuento de {formatPrice(currency, done.discountApplied)} aplicado.
            </span>
          ) : null}{" "}
          Te llamaremos o escribiremos para confirmar.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => {
              setStep("service");
              setService(null);
              setSelectedStaff(null);
              setDate(null);
              setTime(null);
              setName("");
              setPhone("");
              setNotes("");
              setDone(null);
            }}
            className="bg-brand hover:bg-rose-700 text-ink font-medium px-8 py-3.5 rounded-[4px] transition-colors cursor-pointer"
          >
            Hacer otra reserva
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="text-stone-500 hover:text-ink font-medium px-8 py-3.5 rounded-[4px] border border-stone-300 transition-colors cursor-pointer"
            >
              Cerrar
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div data-lenis-prevent="true" className="bg-white rounded-[4px] border border-stone-200 shadow-lg shadow-ink/5 overflow-hidden">
      {/* ========================================================= */}
      {/* PASO 1: ELIGE SERVICIO                                    */}
      {/* ========================================================= */}
      {step === "service" && (
        <>
          <div className="px-6 md:px-10 py-6 border-b border-stone-100 flex items-center justify-between">
            <h3 className="font-serif text-2xl text-ink">Elige tu servicio</h3>
            {loadingStaff && (
              <span className="flex items-center gap-1.5 text-xs text-stone-400">
                <Loader2 size={13} className="animate-spin text-accent" />
                Cargando…
              </span>
            )}
          </div>

          {selectedStaff && (
            <div className="mx-6 md:mx-10 mt-5 p-3.5 bg-stone-100/90 border border-stone-200 rounded-[4px] flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="relative w-9 h-9 rounded-[4px] overflow-hidden bg-stone-200 shrink-0 border border-stone-300">
                  {selectedStaff.avatar ? (
                    <img
                      src={selectedStaff.avatar}
                      alt={selectedStaff.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-stone-700">
                      {selectedStaff.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-stone-900 leading-tight">
                    Cita con: {selectedStaff.name}
                  </p>
                  <p className="text-stone-500 text-[11px] mt-0.5">{selectedStaff.role}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStaff(null)}
                className="text-stone-500 hover:text-stone-900 underline text-xs cursor-pointer shrink-0 font-medium"
              >
                Cualquier especialista
              </button>
            </div>
          )}

          <div className="p-6 md:p-10 space-y-3">
            {(selectedStaff && selectedStaff.services && selectedStaff.services.length > 0
              ? services.filter((s) => selectedStaff.services!.includes(s.id))
              : services
            ).map((s) => (
              <button
                key={s.id}
                onClick={() => handleSelectService(s)}
                className="w-full text-left bg-ivory hover:bg-blush/40 border border-stone-200 hover:border-rose-900/30 rounded-[4px] px-5 py-4 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-serif text-xl text-ink">{s.name}</p>
                    {s.description && (
                      <p className="text-sm text-stone-500 font-light">{s.description}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-accent font-medium">
                      {formatPrice(currency, s.price)}
                    </p>
                    <p className="text-xs text-stone-500">{s.duration_minutes} min</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {/* ========================================================= */}
      {/* PASO 2: ELIGE / CONFIRMA ESPECIALISTA                     */}
      {/* ========================================================= */}
      {step === "staff" && service && (
        <div className="p-6 md:p-10">
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => {
                if (services.length > 1) {
                  setStep("service");
                } else if (onClose) {
                  onClose();
                }
              }}
              aria-label="Volver a servicios"
              className="text-stone-500 hover:text-accent transition-colors cursor-pointer"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h3 className="font-serif text-2xl text-ink">
                {loadingStaff
                  ? "Buscando especialistas…"
                  : availableStaff.length === 1
                  ? "Tu especialista"
                  : "Elige tu especialista"}
              </h3>
              <p className="text-xs text-stone-500">
                Para el servicio de <strong className="text-ink font-medium">{service.name}</strong>
              </p>
            </div>
          </div>

          {loadingStaff ? (
            <div className="py-12 text-center">
              <Loader2 size={32} className="animate-spin text-accent mx-auto mb-3" />
              <p className="text-sm text-stone-500">
                Cargando especialistas disponibles para {service.name}…
              </p>
            </div>
          ) : availableStaff.length === 1 ? (
            /* CASO 1: Solo hay 1 especialista calificado */
            <div className="max-w-xl mx-auto space-y-5">
              <div className="bg-blush/30 border-2 border-accent/40 rounded-[4px] p-5 flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left shadow-xs">
                <div className="relative w-20 h-20 rounded-[4px] overflow-hidden bg-stone-100 shrink-0 border-2 border-accent/30 shadow-sm">
                  {availableStaff[0].avatar ? (
                    <Image
                      src={availableStaff[0].avatar}
                      alt={availableStaff[0].name}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-brand/20 text-brand-deep font-bold text-2xl">
                      {availableStaff[0].name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-accent bg-white/90 px-2.5 py-0.5 rounded-[4px] border border-accent/20 mb-1.5">
                    <Sparkles size={11} /> Especialista calificada
                  </span>
                  <h4 className="font-serif text-2xl text-ink font-bold">
                    {availableStaff[0].name}
                  </h4>
                  <p className="text-sm text-stone-600 font-medium mt-0.5">
                    {availableStaff[0].role}
                  </p>
                  <p className="text-xs text-stone-400 mt-1">
                    Atenderá tu cita de {service.name} de forma exclusiva y personalizada.
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedStaff(availableStaff[0]);
                    setStep("schedule");
                  }}
                  className="w-full bg-brand hover:bg-rose-700 text-ink font-medium px-6 py-4 rounded-[4px] transition-colors cursor-pointer shadow-sm text-center font-medium inline-flex items-center justify-center gap-2"
                >
                  Continuar con {availableStaff[0].name.split(" ")[0]}
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          ) : availableStaff.length > 1 ? (
            /* CASO 2: Hay 2 o más especialistas calificados */
            <div className="space-y-4">
              <p className="text-xs text-stone-500">
                Selecciona con quién deseas atenderte:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {availableStaff.map((member) => (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => {
                      setSelectedStaff(member);
                      setStep("schedule");
                    }}
                    className={`w-full text-left rounded-[4px] p-5 transition-all flex items-center gap-4 group cursor-pointer shadow-xs ${
                      selectedStaff?.id === member.id
                        ? "bg-blush/30 border-2 border-accent"
                        : "bg-white hover:bg-stone-50 border border-stone-200 hover:border-accent"
                    }`}
                  >
                    <div className="relative w-14 h-14 rounded-[4px] overflow-hidden bg-stone-100 shrink-0 border border-stone-200">
                      {member.avatar ? (
                        <Image
                          src={member.avatar}
                          alt={member.name}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-brand/20 text-brand-deep font-bold text-lg">
                          {member.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-stone-900 group-hover:text-accent transition-colors truncate">
                        {member.name}
                      </h4>
                      <p className="text-xs text-accent font-medium truncate mt-0.5">
                        {member.role}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* CASO 3: Sin especialistas registrados específicamente */
            <div className="max-w-md mx-auto text-center py-8 space-y-4">
              <div className="w-14 h-14 rounded-[4px] bg-amber-50 text-amber-700 flex items-center justify-center mx-auto">
                <Users size={26} />
              </div>
              <div>
                <h4 className="font-serif text-xl text-ink font-bold">
                  Sin especialistas asignados
                </h4>
                <p className="text-xs text-stone-500 mt-1">
                  Actualmente no hay un profesional registrado para este servicio.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStep("service")}
                className="w-full bg-stone-100 hover:bg-stone-200 text-ink font-medium px-6 py-3.5 rounded-[4px] transition-colors cursor-pointer"
              >
                Elegir otro servicio
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* PASO 3: ELIGE DÍA Y HORA                                  */}
      {/* ========================================================= */}
      {step === "schedule" && service && (
        <div className="p-4 sm:p-6 lg:p-7">
          <div className="flex items-center gap-2.5 mb-4">
            <button
              onClick={() => {
                setStep("staff");
              }}
              aria-label="Volver"
              className="text-stone-500 hover:text-accent transition-colors cursor-pointer p-1"
            >
              <ArrowLeft size={18} />
            </button>
            <h3 className="font-serif text-xl sm:text-2xl text-ink font-bold">Elige día y hora</h3>
          </div>

          <div className="grid gap-4 grid-cols-1 md:grid-cols-[250px_minmax(0,1fr)_240px] items-stretch">
            {/* COLUMNA 1 (IZQUIERDA): TU CITA */}
            <aside className="bg-ink text-ivory rounded-[4px] p-4 sm:p-5 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between md:block">
                  <div>
                    <p className="text-blush uppercase tracking-[0.2em] text-[10px] mb-1">Tu cita</p>
                    <h4 className="font-serif text-lg md:text-xl text-white font-bold leading-tight">{service.name}</h4>
                  </div>
                  <div className="md:hidden text-right shrink-0">
                    <span className="text-xs text-gold font-bold">{formatPrice(currency, service.price)}</span>
                    <p className="text-[10px] text-ivory/60">{service.duration_minutes} min</p>
                  </div>
                </div>

                {service.description && (
                  <p className="text-ivory/60 text-xs font-light mt-2 hidden md:block">
                    {service.description}
                  </p>
                )}
              </div>

              <div className="space-y-2 text-xs text-ivory/80 pt-3 border-t border-ivory/10">
                <p className="flex items-center gap-1.5 font-medium text-ivory">
                  <User size={13} className="text-gold shrink-0" />
                  <span className="truncate">{selectedStaff ? selectedStaff.name : "Especialista asignado"}</span>
                </p>
                <div className="hidden md:flex items-center justify-between text-xs pt-1">
                  <span className="flex items-center gap-1 text-ivory/70 text-[11px]">
                    <Clock size={12} className="text-gold shrink-0" />
                    {service.duration_minutes} minutos
                  </span>
                  <span className="font-bold text-gold text-xs">
                    {formatPrice(currency, service.price)}
                  </span>
                </div>
              </div>

              <div className="mt-auto pt-3 border-t border-ivory/10 text-[11px] text-ivory/50 hidden md:block">
                <p className="font-serif text-sm text-ivory mb-0.5">{salonName}</p>
                <p className="text-[10px]">Reservas en línea · Confirmación inmediata</p>
              </div>
            </aside>

            {/* COLUMNA 2 (CENTRO): CALENDARIO */}
            <MonthCalendar
              value={date}
              onChange={(d) => {
                setDate(d);
                setTime(null);
                setSlots([]);
              }}
              closedDays={closedDays}
            />

            {/* COLUMNA 3 (DERECHA): HORARIOS DISPONIBLES */}
            {/* Mantiene EXACTAMENTE el mismo tamaño con o sin selección */}
            <aside className="bg-ivory/60 rounded-[4px] border border-stone-200 p-4 flex flex-col justify-between h-full min-h-[300px] md:min-h-0">
              <div className="flex-1 min-h-0 flex flex-col">
                <p className="text-xs font-semibold text-stone-600 uppercase tracking-wider mb-2.5 shrink-0">
                  {date
                    ? loadingSlots
                      ? "Cargando horarios…"
                      : "Horarios disponibles"
                    : "Elige una fecha"}
                </p>
                {!date ? (
                  <div className="h-[180px] md:h-[235px] flex items-center justify-center bg-white rounded-[4px] p-4 text-center">
                    <p className="text-stone-500 text-xs font-light">
                      Selecciona un día en el calendario para ver horarios.
                    </p>
                  </div>
                ) : loadingSlots ? (
                  <div className="h-[180px] md:h-[235px] flex items-center justify-center py-6">
                    <Loader2 className="animate-spin text-rose-800" size={24} />
                  </div>
                ) : slots.length === 0 ? (
                  <div className="h-[180px] md:h-[235px] flex items-center justify-center bg-white rounded-[4px] p-4 text-center">
                    <p className="text-stone-500 font-light text-xs">
                      No hay horarios disponibles este día. Elige otra fecha.
                    </p>
                  </div>
                ) : (
                  <div
                    data-lenis-prevent="true"
                    className="h-[180px] md:h-[235px] grid grid-cols-3 sm:grid-cols-4 md:flex md:flex-col gap-1.5 overflow-y-auto overscroll-contain no-scrollbar pr-0.5"
                    style={{
                      touchAction: "pan-y",
                      scrollbarWidth: "none",
                      msOverflowStyle: "none",
                    }}
                  >
                    {slots.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTime(t)}
                        className={`rounded-[4px] border py-2 px-2.5 text-xs font-medium text-center md:text-left transition-colors cursor-pointer shrink-0 ${
                          t === time
                            ? "bg-brand border-brand text-ink font-bold shadow-xs"
                            : "bg-white border-stone-200 text-stone-700 hover:border-stone-400 hover:bg-stone-50"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                disabled={!time}
                onClick={() => setStep("details")}
                className="mt-3 w-full bg-brand hover:bg-rose-700 disabled:bg-stone-300 disabled:cursor-not-allowed text-ink font-semibold px-4 py-2.5 rounded-[4px] transition-colors cursor-pointer shrink-0 text-xs shadow-xs"
              >
                Continuar
              </button>
            </aside>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* PASO 4: DATOS DEL CLIENTE                                  */}
      {/* ========================================================= */}
      {step === "details" && service && date && time && (
        <>
          <div className="px-6 md:px-10 py-6 border-b border-stone-100 flex items-center gap-3">
            <button
              onClick={() => setStep("schedule")}
              aria-label="Volver"
              className="text-stone-500 hover:text-accent transition-colors cursor-pointer"
            >
              <ArrowLeft size={20} />
            </button>
            <h3 className="font-serif text-2xl text-ink">Tus datos</h3>
          </div>
          <div className="p-6 md:p-10">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submit();
              }}
              className="space-y-5"
            >
              <div className="bg-blush/50 rounded-[4px] px-5 py-4 text-sm text-accent-deep">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-serif text-lg text-ink font-bold">{service.name}</p>
                    <p className="text-accent/80 text-xs sm:text-sm">
                      {dateLabel(date)} a las {time} · {service.duration_minutes} min
                    </p>
                    <p className="text-xs text-stone-600 mt-1">
                      Especialista:{" "}
                      <strong className="text-ink">
                        {selectedStaff ? selectedStaff.name : "Especialista asignado"}
                      </strong>
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    {currentPromo ? (
                      <div>
                        <span className="inline-block bg-white text-stone-900 border border-stone-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded-[4px] mb-1">
                          {currentPromo.promo_type === "first_visit" ? "1ª VISITA" : "PROMO"} -{currentPromo.discount}%
                        </span>
                        <p className="text-xs line-through text-stone-400 font-sans">
                          {formatPrice(currency, service.price)}
                        </p>
                        <p className="font-serif text-lg font-bold text-ink">
                          {formatPrice(
                            currency,
                            Math.max(
                              0,
                              service.price - Math.round((service.price * currentPromo.discount) / 100)
                            )
                          )}
                        </p>
                      </div>
                    ) : (
                      <p className="font-serif text-lg font-bold text-ink">
                        {formatPrice(currency, service.price)}
                      </p>
                    )}
                  </div>
                </div>

                {currentPromo && (
                  <div className="mt-2.5 pt-2 border-t border-stone-200/60 flex items-center justify-between text-xs text-stone-600">
                    <span>Oferta: {currentPromo.title}</span>
                    <button
                      type="button"
                      onClick={() => setPromoApplied(false)}
                      className="text-[11px] text-stone-500 hover:text-red-700 underline cursor-pointer"
                    >
                      Quitar promoción
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">
                  Tu nombre *
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. María López"
                  className="w-full rounded-[4px] border border-stone-300 px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-rose-800/40 bg-ivory/50"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5 flex items-center justify-between">
                  <span>Teléfono / WhatsApp *</span>
                  <span className="text-xs text-stone-400 font-normal">Solo números</span>
                </label>
                <PhoneInput
                  value={phone}
                  onChange={(val) => setPhone(val)}
                  variant="public"
                  placeholder="71234567"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">
                  Notas (opcional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej. Quiero un corte con capas o tono específico"
                  rows={2}
                  className="w-full rounded-[4px] border border-stone-300 px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-rose-800/40 bg-ivory/50 resize-none"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-[4px] p-4 text-sm text-red-800 space-y-2">
                  <p>{error}</p>
                  {currentPromo && (
                    <button
                      type="button"
                      onClick={() => {
                        setPromoApplied(false);
                        setError("");
                      }}
                      className="text-xs font-semibold text-stone-900 underline hover:text-stone-700 block cursor-pointer"
                    >
                      → Continuar reserva con precio regular ({formatPrice(currency, service.price)})
                    </button>
                  )}
                </div>
              )}

              <button
                disabled={submitting}
                className="w-full bg-brand hover:bg-rose-700 disabled:bg-stone-300 text-ink font-medium px-6 py-4 rounded-[4px] transition-colors cursor-pointer"
              >
                {submitting ? "Enviando…" : "Confirmar reserva"}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}