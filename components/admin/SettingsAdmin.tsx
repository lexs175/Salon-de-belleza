"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Building2,
  Check,
  CheckCircle2,
  Clock,
  Compass,
  Copy,
  ExternalLink,
  Globe,
  KeyRound,
  Loader2,
  Lock,
  MapPin,
  MessageCircle,
  RotateCcw,
  Save,
  ShieldCheck,
  Sparkles,
  Store,
  Video,
} from "lucide-react";
import PhoneInput from "@/components/PhoneInput";
import Button, { buttonClasses } from "@/components/ui/Button";
import { showToast } from "./toast";

function InstagramIcon({ size = 14, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Lun a Dom
const DAY_LABELS: Record<number, { full: string; short: string }> = {
  1: { full: "Lunes", short: "Lun" },
  2: { full: "Martes", short: "Mar" },
  3: { full: "Miércoles", short: "Mié" },
  4: { full: "Jueves", short: "Jue" },
  5: { full: "Viernes", short: "Vie" },
  6: { full: "Sábado", short: "Sáb" },
  0: { full: "Domingo", short: "Dom" },
};

type HoursState = Record<string, { open: string; close: string; closed: boolean }>;

function hoursToState(hoursJson: string): HoursState {
  try {
    const parsed: Record<string, string | null> = JSON.parse(hoursJson);
    const state: HoursState = {};
    for (let i = 0; i < 7; i++) {
      const range = parsed[String(i)];
      if (range) {
        const [open, close] = range.split("-").map((t) => t.trim());
        state[String(i)] = { open, close, closed: false };
      } else {
        state[String(i)] = { open: "09:00", close: "19:00", closed: true };
      }
    }
    return state;
  } catch {
    const fallback: HoursState = {};
    for (let i = 0; i < 7; i++) {
      fallback[String(i)] = { open: "09:00", close: "19:00", closed: i === 0 };
    }
    return fallback;
  }
}

export default function SettingsAdmin() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    salon_name: "",
    slogan: "",
    description: "",
    address: "",
    phone: "",
    instagram: "",
    tiktok: "",
    currency: "Bs.",
  });
  const [hours, setHours] = useState<HoursState>({});
  const [newPassword, setNewPassword] = useState("");
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then(
        (data: {
          settings: {
            salon_name: string;
            slogan: string;
            description: string;
            address: string;
            phone: string;
            instagram: string;
            tiktok: string;
            currency: string;
            hours: string;
          };
        }) => {
          const s = data.settings;
          setForm({
            salon_name: s.salon_name || "",
            slogan: s.slogan || "",
            description: s.description || "",
            address: s.address || "",
            phone: s.phone || "",
            instagram: s.instagram || "",
            tiktok: s.tiktok || "",
            currency: s.currency || "Bs.",
          });
          setHours(hoursToState(s.hours));
        }
      )
      .catch(() => showToast("Error al cargar configuración", "error"))
      .finally(() => setLoading(false));
  }, []);

  async function save(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!form.salon_name.trim()) {
      showToast("El nombre del salón es obligatorio.", "error");
      return;
    }
    setSaving(true);

    const hoursJson: Record<string, string | null> = {};
    for (let i = 0; i < 7; i++) {
      const h = hours[String(i)];
      hoursJson[String(i)] = h && !h.closed ? `${h.open}-${h.close}` : null;
    }

    const body: Record<string, unknown> = { ...form, hours: hoursJson };
    if (newPassword.trim()) {
      if (newPassword.trim().length < 6) {
        showToast("La nueva contraseña debe tener al menos 6 caracteres.", "error");
        setSaving(false);
        return;
      }
      body.new_password = newPassword.trim();
    }

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error ?? "Error al guardar.", "error");
      } else {
        showToast("Configuración guardada correctamente.", "success");
        setNewPassword("");
        const now = new Date();
        setLastSavedTime(
          now.toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" })
        );
      }
    } catch {
      showToast("Error de conexión al guardar.", "error");
    } finally {
      setSaving(false);
    }
  }

  // Presets rápidos para horarios
  function applyPreset(type: "standard" | "extended" | "copyMonday") {
    if (type === "standard") {
      const next: HoursState = {};
      for (let i = 0; i < 7; i++) {
        next[String(i)] = { open: "09:00", close: "19:00", closed: i === 0 }; // Lun a Sab 9-19, Dom cerrado
      }
      setHours(next);
      showToast("Horario aplicado: Lun a Sáb 09:00 a 19:00 (Dom cerrado)", "info");
    } else if (type === "extended") {
      const next: HoursState = {};
      for (let i = 0; i < 7; i++) {
        next[String(i)] = {
          open: "08:30",
          close: "20:00",
          closed: i === 0,
        };
      }
      setHours(next);
      showToast("Horario aplicado: Lun a Sáb 08:30 a 20:00 (Dom cerrado)", "info");
    } else if (type === "copyMonday") {
      const mon = hours["1"] || { open: "09:00", close: "19:00", closed: false };
      const next: HoursState = { ...hours };
      [2, 3, 4, 5, 6].forEach((d) => {
        next[String(d)] = { ...mon };
      });
      setHours(next);
      showToast("Horario de Lunes copiado a Martes-Sábado", "info");
    }
  }

  // Estado de hoy para la vista previa en vivo
  const todayStatus = useMemo(() => {
    const dow = new Date().getDay();
    const h = hours[String(dow)];
    if (!h || h.closed) return { open: false, text: "Cerrado hoy" };
    return { open: true, text: `Abierto hoy · ${h.open} a ${h.close}` };
  }, [hours]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-28">
        <Loader2 className="animate-spin text-stone-700" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Barra superior con Título y Botón de Guardar fijo en desktop */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-stone-200">
        <div>
          <h1 className="font-serif text-2xl text-stone-900 font-bold">Configuración del Salón</h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            Gestiona la información pública de tu marca, horarios de atención y datos de contacto.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          {lastSavedTime && (
            <span className="text-[11px] text-stone-400 font-mono hidden md:inline">
              Guardado a las {lastSavedTime}
            </span>
          )}
          <button
            onClick={() => save()}
            disabled={saving}
            className={buttonClasses("dark", "md", "gap-2 shadow-xs")}
          >
            {saving ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <Save size={15} />
                <span>Guardar Cambios</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Grid Principal: 2 Columnas amplias que aprovechan todo el ancho */}
      <form onSubmit={save} className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* ========================================================= */}
        {/* COLUMNA IZQUIERDA (8 / 12): FORMULARIO PRINCIPAL           */}
        {/* ========================================================= */}
        <div className="xl:col-span-8 space-y-6">
          {/* SECCIÓN 1: IDENTIDAD DE MARCA */}
          <div className="bg-white rounded-[4px] border border-stone-200 p-5 sm:p-7 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-[4px] bg-stone-100 text-stone-700 flex items-center justify-center">
                  <Store size={16} />
                </div>
                <div>
                  <h2 className="font-semibold text-stone-900 text-sm sm:text-base">
                    Identidad y Presencia Pública
                  </h2>
                  <p className="text-xs text-stone-500">
                    Nombre visible en la web, cabecera y comprobantes de cita.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                  Nombre Oficial del Salón <span className="text-rose-600">*</span>
                </label>
                <div className="flex items-stretch rounded-[4px] border border-stone-300 bg-white focus-within:border-stone-900 focus-within:ring-1 focus-within:ring-stone-900/10 transition-all overflow-hidden shadow-2xs">
                  <span className="flex items-center px-3 bg-stone-100/90 border-r border-stone-200 text-stone-500 shrink-0 select-none">
                    <Store size={14} className="text-stone-400" />
                  </span>
                  <input
                    value={form.salon_name}
                    onChange={(e) => setForm({ ...form, salon_name: e.target.value })}
                    placeholder="Ej. Salón de Belleza"
                    className="w-full bg-transparent px-3.5 py-2.5 text-sm font-medium text-stone-900 placeholder:text-stone-400 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                  Eslogan o Lema
                </label>
                <div className="flex items-stretch rounded-[4px] border border-stone-300 bg-white focus-within:border-stone-900 focus-within:ring-1 focus-within:ring-stone-900/10 transition-all overflow-hidden shadow-2xs">
                  <span className="flex items-center px-3 bg-stone-100/90 border-r border-stone-200 text-stone-500 shrink-0 select-none">
                    <Sparkles size={14} className="text-stone-400" />
                  </span>
                  <input
                    value={form.slogan}
                    onChange={(e) => setForm({ ...form, slogan: e.target.value })}
                    placeholder="Ej. Tu belleza, nuestro arte"
                    className="w-full bg-transparent px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                  Símbolo de Moneda (Catálogo)
                </label>
                <div className="flex items-stretch rounded-[4px] border border-stone-300 bg-white focus-within:border-stone-900 focus-within:ring-1 focus-within:ring-stone-900/10 transition-all overflow-hidden shadow-2xs">
                  <span className="flex items-center px-3 bg-stone-100/90 border-r border-stone-200 text-stone-600 font-mono text-xs font-bold shrink-0 select-none">
                    $
                  </span>
                  <input
                    value={form.currency}
                    onChange={(e) => setForm({ ...form, currency: e.target.value })}
                    placeholder="Bs."
                    className="w-full bg-transparent px-3.5 py-2.5 text-sm font-mono font-semibold text-stone-900 placeholder:text-stone-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700">
                    Descripción del Salón
                  </label>
                  <span className="text-[11px] text-stone-400 font-mono">
                    {form.description.length} caracteres
                  </span>
                </div>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  placeholder="Describe brevemente tus servicios, filosofía y especialidades..."
                  className="w-full rounded-[4px] border border-stone-300 px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900/10 bg-white resize-none shadow-2xs"
                />
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: CONTACTO Y UBICACIÓN */}
          <div className="bg-white rounded-[4px] border border-stone-200 p-5 sm:p-7 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 border-b border-stone-100 pb-3">
              <div className="h-8 w-8 rounded-[4px] bg-stone-100 text-stone-700 flex items-center justify-center">
                <MapPin size={16} />
              </div>
              <div>
                <h2 className="font-semibold text-stone-900 text-sm sm:text-base">
                  Contacto, Ubicación y Redes
                </h2>
                <p className="text-xs text-stone-500">
                  Canales donde los clientes te encontrarán y confirmarán sus citas.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                  Teléfono / WhatsApp Oficial *
                </label>
                <PhoneInput
                  value={form.phone}
                  onChange={(v) => setForm({ ...form, phone: v })}
                  variant="admin"
                  placeholder="71234567"
                />
                <p className="text-[11px] text-stone-400 mt-1">
                  Se usa en los enlaces automáticos de confirmación por chat.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                  Dirección del Local
                </label>
                <div className="flex items-stretch rounded-[4px] border border-stone-300 bg-white focus-within:border-stone-900 focus-within:ring-1 focus-within:ring-stone-900/10 transition-all overflow-hidden shadow-2xs">
                  <span className="flex items-center px-3 bg-stone-100/90 border-r border-stone-200 text-stone-500 shrink-0 select-none">
                    <MapPin size={14} className="text-stone-400" />
                  </span>
                  <input
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    placeholder="Ej. Av. San Martín #450, Equipetrol"
                    className="w-full bg-transparent px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                  Instagram
                </label>
                <div className="flex items-stretch rounded-[4px] border border-stone-300 bg-white focus-within:border-stone-900 focus-within:ring-1 focus-within:ring-stone-900/10 transition-all overflow-hidden shadow-2xs">
                  <span className="flex items-center gap-1.5 bg-stone-100/90 border-r border-stone-200 px-3 text-stone-600 font-mono text-xs font-semibold select-none shrink-0">
                    <InstagramIcon size={14} className="text-stone-400" />
                    <span>@</span>
                  </span>
                  <input
                    value={form.instagram}
                    onChange={(e) =>
                      setForm({ ...form, instagram: e.target.value.replace(/^@/, "") })
                    }
                    placeholder="beautypalace.bo"
                    className="w-full bg-transparent px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                  TikTok
                </label>
                <div className="flex items-stretch rounded-[4px] border border-stone-300 bg-white focus-within:border-stone-900 focus-within:ring-1 focus-within:ring-stone-900/10 transition-all overflow-hidden shadow-2xs">
                  <span className="flex items-center gap-1.5 bg-stone-100/90 border-r border-stone-200 px-3 text-stone-600 font-mono text-xs font-semibold select-none shrink-0">
                    <Video size={14} className="text-stone-400" />
                    <span>@</span>
                  </span>
                  <input
                    value={form.tiktok}
                    onChange={(e) =>
                      setForm({ ...form, tiktok: e.target.value.replace(/^@/, "") })
                    }
                    placeholder="beautypalace"
                    className="w-full bg-transparent px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none font-medium"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECCIÓN 3: HORARIOS DE ATENCIÓN */}
          <div className="bg-white rounded-[4px] border border-stone-200 p-5 sm:p-7 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-[4px] bg-stone-100 text-stone-700 flex items-center justify-center">
                  <Clock size={16} />
                </div>
                <div>
                  <h2 className="font-semibold text-stone-900 text-sm sm:text-base">
                    Horario de Atención Semanal
                  </h2>
                  <p className="text-xs text-stone-500">
                    Solo se ofrecerán turnos dentro de los días y horas definidos aquí.
                  </p>
                </div>
              </div>

              {/* Botones de presets rápidos */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => applyPreset("standard")}
                  className="text-[11px] font-medium bg-stone-100 hover:bg-stone-200 text-stone-700 px-2.5 py-1 rounded-[4px] border border-stone-200 transition-colors cursor-pointer"
                >
                  9:00 - 19:00
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset("extended")}
                  className="text-[11px] font-medium bg-stone-100 hover:bg-stone-200 text-stone-700 px-2.5 py-1 rounded-[4px] border border-stone-200 transition-colors cursor-pointer"
                >
                  8:30 - 20:00
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset("copyMonday")}
                  className="text-[11px] font-medium bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-[4px] border border-emerald-200 transition-colors cursor-pointer inline-flex items-center gap-1"
                  title="Copiar horario de Lunes a Martes-Sábado"
                >
                  <Copy size={11} />
                  <span>Copiar Lun a Sáb</span>
                </button>
              </div>
            </div>

            {/* Grilla visual de Lunes a Domingo */}
            <div className="divide-y divide-stone-100 border border-stone-200/80 rounded-[4px] overflow-hidden">
              {DAY_ORDER.map((dayNum) => {
                const dayKey = String(dayNum);
                const h = hours[dayKey] || { open: "09:00", close: "19:00", closed: true };
                const dayMeta = DAY_LABELS[dayNum];
                const isSunday = dayNum === 0;

                return (
                  <div
                    key={dayKey}
                    className={`flex items-center justify-between gap-3 px-4 py-3 text-xs transition-colors ${
                      h.closed ? "bg-stone-50/60" : "bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-[120px]">
                      <span
                        className={`w-9 text-center font-mono font-bold text-[11px] py-1 rounded-[4px] border ${
                          isSunday
                            ? "bg-amber-50 text-amber-900 border-amber-200"
                            : h.closed
                            ? "bg-stone-100 text-stone-400 border-stone-200"
                            : "bg-stone-950 text-white border-stone-950"
                        }`}
                      >
                        {dayMeta.short}
                      </span>
                      <span
                        className={`font-medium ${
                          h.closed ? "text-stone-400" : "text-stone-800"
                        }`}
                      >
                        {dayMeta.full}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {h.closed ? (
                        <span className="text-stone-400 font-mono italic text-xs py-1">
                          Cerrado al público
                        </span>
                      ) : (
                        <div className="flex items-center gap-2 font-mono">
                          <input
                            type="time"
                            value={h.open}
                            onChange={(e) =>
                              setHours({
                                ...hours,
                                [dayKey]: { ...h, open: e.target.value },
                              })
                            }
                            className="rounded-[4px] border border-stone-300 px-2.5 py-1 text-xs focus:outline-none focus:border-stone-900 bg-white"
                          />
                          <span className="text-stone-400 text-xs">hasta</span>
                          <input
                            type="time"
                            value={h.close}
                            onChange={(e) =>
                              setHours({
                                ...hours,
                                [dayKey]: { ...h, close: e.target.value },
                              })
                            }
                            className="rounded-[4px] border border-stone-300 px-2.5 py-1 text-xs focus:outline-none focus:border-stone-900 bg-white"
                          />
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          setHours({
                            ...hours,
                            [dayKey]: { ...h, closed: !h.closed },
                          })
                        }
                        className={`px-3 py-1 rounded-[4px] border text-[11px] font-semibold transition-colors cursor-pointer ${
                          !h.closed
                            ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                            : "bg-stone-200 text-stone-600 border-stone-300 hover:bg-stone-300"
                        }`}
                      >
                        {!h.closed ? "Abierto" : "Cerrado"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECCIÓN 4: SEGURIDAD DEL ADMIN */}
          <div className="bg-white rounded-[4px] border border-stone-200 p-5 sm:p-7 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 border-b border-stone-100 pb-3">
              <div className="h-8 w-8 rounded-[4px] bg-stone-100 text-stone-700 flex items-center justify-center">
                <ShieldCheck size={16} />
              </div>
              <div>
                <h2 className="font-semibold text-stone-900 text-sm sm:text-base">
                  Seguridad de Acceso
                </h2>
                <p className="text-xs text-stone-500">
                  Cambia la contraseña maestra de acceso a este panel de administración.
                </p>
              </div>
            </div>

            <div className="max-w-md">
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                Nueva Contraseña de Acceso
              </label>
              <div className="flex items-stretch rounded-[4px] border border-stone-300 bg-white focus-within:border-stone-900 focus-within:ring-1 focus-within:ring-stone-900/10 transition-all overflow-hidden shadow-2xs">
                <span className="flex items-center px-3 bg-stone-100/90 border-r border-stone-200 text-stone-500 shrink-0 select-none">
                  <KeyRound size={14} className="text-stone-400" />
                </span>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Dejar vacío para conservar la contraseña actual"
                  className="w-full bg-transparent px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none"
                />
              </div>
              <p className="text-[11px] text-stone-400 mt-1">
                Mínimo 6 caracteres. Si no deseas cambiarla, déjala en blanco.
              </p>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* COLUMNA DERECHA (4 / 12): VISTA PREVIA EN VIVO Y ACCIONES   */}
        {/* ========================================================= */}
        <div className="xl:col-span-4 space-y-6 sticky top-6">
          {/* TARJETA 1: VISTA PREVIA PÚBLICA EN VIVO */}
          <div className="bg-white rounded-[4px] border border-stone-200 shadow-sm overflow-hidden">
            <div className="bg-stone-950 text-white px-5 py-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-[#C5A880]" />
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-stone-200">
                  Vista Previa en Vivo
                </span>
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-300 bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 rounded-[4px]">
                <span className="w-1.5 h-1.5 rounded-[4px] bg-emerald-400 animate-pulse" />
                Tiempo real
              </span>
            </div>

            <div className="p-5 sm:p-6 space-y-4">
              {/* Tarjeta de Marca */}
              <div className="border border-stone-200 rounded-[4px] p-4 bg-stone-50/50 space-y-2.5">
                <p className="text-[10px] font-mono uppercase tracking-widest text-[#9E7D52]">
                  {form.slogan || "Tu belleza, nuestro arte"}
                </p>
                <h3 className="font-serif text-2xl font-bold text-stone-900 leading-tight">
                  {form.salon_name || "Nombre de tu Salón"}
                </h3>
                {form.description && (
                  <p className="text-xs text-stone-600 line-clamp-3 font-light leading-relaxed">
                    {form.description}
                  </p>
                )}
              </div>

              {/* Estado de Hoy */}
              <div className="flex items-center gap-2.5 p-3 rounded-[4px] border border-stone-200 text-xs bg-white">
                <div
                  className={`w-2 h-2 rounded-[4px] shrink-0 ${
                    todayStatus.open ? "bg-emerald-500" : "bg-amber-500"
                  }`}
                />
                <span className="font-medium text-stone-800">{todayStatus.text}</span>
              </div>

              {/* Datos de Contacto */}
              <div className="space-y-2 text-xs text-stone-600">
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-stone-400 shrink-0" />
                  <span className="truncate">{form.address || "Dirección no especificada"}</span>
                </div>

                <div className="flex items-center gap-2">
                  <MessageCircle size={14} className="text-emerald-700 shrink-0" />
                  <span className="font-mono font-semibold text-stone-900">
                    {form.phone || "Sin teléfono registrado"}
                  </span>
                </div>

                {(form.instagram || form.tiktok) && (
                  <div className="flex items-center gap-2 pt-2 border-t border-stone-100 flex-wrap">
                    {form.instagram && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono bg-stone-100 text-stone-700 px-2 py-0.5 rounded-[4px]">
                        <InstagramIcon size={11} />@{form.instagram}
                      </span>
                    )}
                    {form.tiktok && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono bg-stone-100 text-stone-700 px-2 py-0.5 rounded-[4px]">
                        <Video size={11} />@{form.tiktok}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Botón hacia el sitio público */}
              <a
                href="/"
                target="_blank"
                rel="noreferrer"
                className="w-full mt-2 inline-flex items-center justify-center gap-2 border border-stone-300 hover:border-stone-900 text-stone-700 hover:text-stone-950 text-xs font-semibold py-2.5 px-4 rounded-[4px] transition-colors"
              >
                <span>Ver Sitio Web Público</span>
                <ExternalLink size={13} />
              </a>
            </div>
          </div>

          {/* TARJETA 2: GUARDADO Y CONFIRMACIÓN */}
          <div className="bg-white rounded-[4px] border border-stone-200 p-5 shadow-xs space-y-3">
            <h4 className="font-semibold text-stone-900 text-xs uppercase tracking-wider">
              Acción de Guardado
            </h4>
            <p className="text-xs text-stone-500 leading-relaxed">
              Los cambios que realices se aplicarán inmediatamente en el banner, el widget de
              reserva y los horarios disponibles.
            </p>

            <button
              type="submit"
              disabled={saving}
              className={buttonClasses("dark", "full", "gap-2 shadow-xs")}
            >
              {saving ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Guardando cambios...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={15} />
                  <span>Guardar Toda la Configuración</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}