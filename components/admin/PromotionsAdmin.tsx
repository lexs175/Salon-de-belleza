"use client";

import { useEffect, useState } from "react";
import {
  Calendar,
  Check,
  ChevronRight,
  Clock,
  Loader2,
  Lock,
  Megaphone,
  Pencil,
  Plus,
  Sparkles,
  Tag,
  Trash2,
  Users,
  X,
} from "lucide-react";
import type { PromoType, Promotion, Service } from "@/lib/types";
import { showToast } from "./toast";
import Button, { buttonClasses } from "@/components/ui/Button";

type FormState = {
  id: number | null;
  title: string;
  text: string;
  service_id: number | "all" | "";
  promo_type: PromoType;
  discount: string;
  starts_at: string;
  ends_at: string;
  max_uses: string;
  active: boolean;
};

const EMPTY: FormState = {
  id: null,
  title: "",
  text: "",
  service_id: "all",
  promo_type: "first_visit",
  discount: "20",
  starts_at: "",
  ends_at: "",
  max_uses: "",
  active: false,
};

export default function PromotionsAdmin() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [resPromo, resServ] = await Promise.all([
        fetch("/api/admin/promotions"),
        fetch("/api/admin/services"),
      ]);
      const dataPromo = (await resPromo.json()) as { promotions: Promotion[] };
      const dataServ = (await resServ.json()) as { services: Service[] };
      setPromotions(dataPromo.promotions || []);
      setServices((dataServ.services || []).filter((s) => s.active));
    } catch {
      showToast("Error al cargar datos", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Servicio seleccionado en el formulario para mostrar precio catálogo
  const isAllServices = form?.service_id === "all" || !form?.service_id;
  const selectedService = !isAllServices
    ? services.find((s) => s.id === Number(form?.service_id))
    : null;
  const catalogPrice = selectedService ? selectedService.price : 0;
  const numDiscount = form ? Number(form.discount) || 0 : 0;
  const finalPrice =
    catalogPrice > 0 && numDiscount > 0
      ? Math.round(catalogPrice * (1 - numDiscount / 100))
      : catalogPrice;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;

    if (!form.title.trim()) {
      showToast("El título es obligatorio.", "error");
      return;
    }
    const discount = Number(form.discount);
    if (Number.isNaN(discount) || discount < 1 || discount > 100) {
      showToast("El descuento debe estar entre 1% y 100%.", "error");
      return;
    }
    if (form.starts_at && form.ends_at && form.starts_at > form.ends_at) {
      showToast("La fecha de inicio no puede ser posterior a la de fin.", "error");
      return;
    }

    setSaving(true);
    const serviceId =
      form.service_id === "all" || !form.service_id ? null : Number(form.service_id);
    const maxUses =
      form.promo_type === "first_visit"
        ? null
        : form.max_uses
        ? Number(form.max_uses)
        : null;

    const body = JSON.stringify({
      title: form.title.trim(),
      text: form.text.trim(),
      service_id: serviceId,
      promo_type: form.promo_type,
      discount: Math.round(discount),
      starts_at: form.starts_at || null,
      ends_at: form.ends_at || null,
      max_uses: maxUses,
      active: form.active,
    });

    try {
      const res = form.id
        ? await fetch(`/api/admin/promotions/${form.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body,
          })
        : await fetch("/api/admin/promotions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body,
          });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error ?? "Error al guardar.", "error");
        setSaving(false);
        return;
      }

      setForm(null);
      await load();
      showToast(form.id ? "Promoción actualizada" : "Promoción creada", "success");
    } catch {
      showToast("Error de conexión.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(p: Promotion) {
    const nextActive = !p.active;
    try {
      const res = await fetch(`/api/admin/promotions/${p.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: p.title,
          text: p.text,
          service_id: p.service_id,
          promo_type: p.promo_type,
          discount: p.discount,
          starts_at: p.starts_at,
          ends_at: p.ends_at,
          max_uses: p.max_uses,
          active: nextActive,
        }),
      });
      if (res.ok) {
        await load();
        showToast(
          nextActive
            ? "Promoción activada (las demás se desactivaron)"
            : "Promoción desactivada",
          "success"
        );
      } else {
        const data = await res.json();
        showToast(data.error ?? "Error al actualizar estado", "error");
      }
    } catch {
      showToast("Error de conexión", "error");
    }
  }

  async function remove(id: number) {
    try {
      await fetch(`/api/admin/promotions/${id}`, { method: "DELETE" });
      setRemovingId(null);
      await load();
      showToast("Promoción eliminada", "success");
    } catch {
      showToast("Error al eliminar", "error");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl text-stone-900">Promociones y Descuentos</h1>
          <p className="text-sm text-stone-500 mt-1">
            Configura promociones para todo el catálogo o servicios específicos. Solo 1 promo activa a la vez.
          </p>
        </div>
        <button
          onClick={() => {
            setForm({
              ...EMPTY,
              service_id: "all",
            });
          }}
          className={buttonClasses("dark", "md", "gap-1.5")}
        >
          <Plus size={15} />
          <span>Nueva Promoción</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-stone-700" size={28} />
        </div>
      ) : (
        <div className="space-y-4">
          {promotions.length === 0 && (
            <div className="bg-white rounded-[4px] border border-stone-200 p-8 text-center">
              <Megaphone size={32} className="mx-auto text-stone-300 mb-2" />
              <p className="text-stone-600 font-medium">Aún no hay promociones creadas.</p>
              <p className="text-stone-400 text-xs mt-1">
                Crea una para destacar tus servicios y captar reservas con descuento real.
              </p>
            </div>
          )}

          {promotions.map((p) => {
            const isAll = !p.service_id;
            const originalPrice = p.service_price ?? p.price ?? 0;
            const discountedPrice =
              originalPrice > 0 ? Math.round(originalPrice * (1 - p.discount / 100)) : 0;
            const isFirstVisit = p.promo_type === "first_visit";

            return (
              <div
                key={p.id}
                className={`bg-white rounded-[4px] border p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
                  p.active
                    ? "border-stone-900 shadow-sm"
                    : "border-stone-200 bg-stone-50/40 opacity-80"
                }`}
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div
                    className={`h-11 w-11 rounded-[4px] flex items-center justify-center shrink-0 ${
                      p.active ? "bg-stone-950 text-white" : "bg-stone-200 text-stone-500"
                    }`}
                  >
                    <Megaphone size={18} />
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-serif text-lg text-stone-900 leading-tight">
                        {p.title}
                      </h3>

                      {p.active ? (
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-[4px] px-2 py-0.5">
                          Activa en web
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono font-medium uppercase tracking-wider bg-stone-100 text-stone-500 border border-stone-200 rounded-[4px] px-2 py-0.5">
                          Inactiva
                        </span>
                      )}

                      <span
                        className={`text-[10px] font-mono font-medium uppercase tracking-wider rounded-[4px] px-2 py-0.5 border ${
                          isFirstVisit
                            ? "bg-amber-50 text-amber-900 border-amber-200"
                            : "bg-blue-50 text-blue-900 border-blue-200"
                        }`}
                      >
                        {isFirstVisit ? "Primera Visita (1x número)" : "General"}
                      </span>
                    </div>

                    <div className="text-xs text-stone-600 flex items-center gap-3 flex-wrap">
                      <span>
                        Servicio:{" "}
                        <strong className="text-stone-900 font-medium">
                          {isAll
                            ? "Todos los servicios (Catálogo completo)"
                            : p.service_name || "Servicio #" + p.service_id}
                        </strong>
                      </span>
                      <span>·</span>
                      <span className="text-emerald-700 font-semibold font-mono">
                        -{p.discount}%
                      </span>
                      {!isAll && originalPrice > 0 && (
                        <>
                          <span>·</span>
                          <span className="font-mono">
                            <span className="line-through text-stone-400 mr-1.5">
                              Bs {originalPrice.toLocaleString("es-BO")}
                            </span>
                            <strong className="text-stone-900">
                              Bs {discountedPrice.toLocaleString("es-BO")}
                            </strong>
                          </span>
                        </>
                      )}
                      <span>·</span>
                      <span className="font-mono text-stone-500">
                        Usos:{" "}
                        <strong className="text-stone-800 font-semibold">
                          {p.current_uses ?? 0}
                        </strong>{" "}
                        / {isFirstVisit ? "1 por cliente" : p.max_uses ? p.max_uses : "∞"}
                      </span>
                    </div>

                    {(p.starts_at || p.ends_at) && (
                      <p className="text-[11px] text-stone-400 font-mono">
                        Vigencia: {p.starts_at || "Inicio"} → {p.ends_at || "Sin fin"}
                      </p>
                    )}

                    {p.text && (
                      <p className="text-xs text-stone-500 line-clamp-1 italic">{p.text}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <button
                    onClick={() => toggleActive(p)}
                    className={buttonClasses(
                      p.active ? "outline" : "dark",
                      "sm",
                      "text-[11px]"
                    )}
                  >
                    {p.active ? "Desactivar" : "Activar"}
                  </button>

                  <button
                    onClick={() =>
                      setForm({
                        id: p.id,
                        title: p.title,
                        text: p.text || "",
                        service_id: p.service_id !== null ? p.service_id : "all",
                        promo_type: p.promo_type,
                        discount: String(p.discount),
                        starts_at: p.starts_at || "",
                        ends_at: p.ends_at || "",
                        max_uses: p.max_uses ? String(p.max_uses) : "",
                        active: !!p.active,
                      })
                    }
                    aria-label="Editar"
                    className="h-8 w-8 rounded-[4px] border border-stone-200 flex items-center justify-center text-stone-600 hover:bg-stone-100 hover:text-stone-900 transition-colors cursor-pointer"
                  >
                    <Pencil size={13} />
                  </button>

                  {removingId === p.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => remove(p.id)}
                        className="text-xs font-semibold text-white bg-red-700 hover:bg-red-800 px-2.5 py-1.5 rounded-[4px] transition-colors cursor-pointer"
                      >
                        Confirmar
                      </button>
                      <button
                        onClick={() => setRemovingId(null)}
                        className="text-xs text-stone-600 hover:text-stone-900 px-2 py-1.5 rounded-[4px] transition-colors cursor-pointer"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setRemovingId(p.id)}
                      aria-label="Eliminar"
                      className="h-8 w-8 rounded-[4px] border border-stone-200 flex items-center justify-center text-stone-400 hover:bg-red-50 hover:border-red-200 hover:text-red-700 transition-colors cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Crear / Editar */}
      {form && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[4px] w-full max-w-lg p-6 sm:p-8 shadow-2xl my-8 border border-stone-200">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-5">
              <div>
                <h2 className="font-serif text-xl text-stone-900">
                  {form.id ? "Editar promoción" : "Nueva promoción"}
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  Elige servicio o catálogo completo, tipo de regla y descuento.
                </p>
              </div>
              <button
                onClick={() => setForm(null)}
                aria-label="Cerrar"
                className="text-stone-400 hover:text-stone-800 p-1 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={save} className="space-y-4 text-sm">
              {/* Servicio vinculado */}
              <div>
                <label className="block font-medium text-stone-800 mb-1">
                  Servicio al que aplica *
                </label>
                <select
                  value={form.service_id}
                  onChange={(e) => {
                    const val = e.target.value;
                    setForm({ ...form, service_id: val === "all" ? "all" : Number(val) || "" });
                  }}
                  className="w-full rounded-[4px] border border-stone-300 px-3.5 py-2.5 bg-stone-50/50 focus:outline-none focus:border-stone-900 font-medium"
                  required
                >
                  <option value="all">★ Todos los servicios (Catálogo completo)</option>
                  <optgroup label="Servicios individuales">
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} (Bs {s.price.toLocaleString("es-BO")})
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Título y subtítulo */}
              <div>
                <label className="block font-medium text-stone-800 mb-1">
                  Título de la promoción *
                </label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder={
                    isAllServices
                      ? "Ej. Descuento de Bienvenida en Todos los Servicios"
                      : "Ej. Balayage Premium - Descuento Especial"
                  }
                  className="w-full rounded-[4px] border border-stone-300 px-3.5 py-2.5 focus:outline-none focus:border-stone-900"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-stone-800 mb-1">
                  Descripción o nota (opcional)
                </label>
                <input
                  value={form.text}
                  onChange={(e) => setForm({ ...form, text: e.target.value })}
                  placeholder="Ej. Válido para clientes nuevos reservando en línea"
                  className="w-full rounded-[4px] border border-stone-300 px-3.5 py-2.5 focus:outline-none focus:border-stone-900"
                />
              </div>

              {/* Tipo de promoción */}
              <div>
                <label className="block font-medium text-stone-800 mb-2">
                  Tipo de Promoción *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        promo_type: "first_visit",
                        max_uses: "", // Limpiar cupo ya que en primera visita es 1 por cliente
                      })
                    }
                    className={`rounded-[4px] border p-3 text-left transition-colors cursor-pointer ${
                      form.promo_type === "first_visit"
                        ? "border-stone-950 bg-stone-950 text-white"
                        : "border-stone-200 bg-white text-stone-700 hover:border-stone-400"
                    }`}
                  >
                    <p className="font-semibold text-xs uppercase tracking-wider">
                      Primera Visita
                    </p>
                    <p
                      className={`text-[11px] mt-1 leading-snug ${
                        form.promo_type === "first_visit" ? "text-stone-300" : "text-stone-500"
                      }`}
                    >
                      1 uso por número de WhatsApp. Bloquea repetición.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setForm({ ...form, promo_type: "general" })}
                    className={`rounded-[4px] border p-3 text-left transition-colors cursor-pointer ${
                      form.promo_type === "general"
                        ? "border-stone-950 bg-stone-950 text-white"
                        : "border-stone-200 bg-white text-stone-700 hover:border-stone-400"
                    }`}
                  >
                    <p className="font-semibold text-xs uppercase tracking-wider">
                      General / Recurrente
                    </p>
                    <p
                      className={`text-[11px] mt-1 leading-snug ${
                        form.promo_type === "general" ? "text-stone-300" : "text-stone-500"
                      }`}
                    >
                      Para todos. Opcional cupo máximo y fechas.
                    </p>
                  </button>
                </div>
              </div>

              {/* Descuento y Preview */}
              <div className="grid grid-cols-2 gap-3 items-end">
                <div>
                  <label className="block font-medium text-stone-800 mb-1">
                    Descuento (%) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={form.discount}
                    onChange={(e) => setForm({ ...form, discount: e.target.value })}
                    className="w-full rounded-[4px] border border-stone-300 px-3.5 py-2.5 focus:outline-none focus:border-stone-900"
                    required
                  />
                </div>

                <div className="bg-stone-50 border border-stone-200 rounded-[4px] p-2.5 text-xs">
                  <p className="text-stone-500 font-mono text-[10px] uppercase">
                    {isAllServices ? "Descuento en catálogo" : "Precio calculado"}
                  </p>
                  {isAllServices ? (
                    <div className="mt-0.5">
                      <p className="font-mono text-emerald-700 font-bold text-sm">
                        -{numDiscount}% en todo el catálogo
                      </p>
                      <p className="text-[10px] text-stone-400 mt-0.5">
                        Aplica al servicio que elija el cliente
                      </p>
                    </div>
                  ) : catalogPrice > 0 ? (
                    <p className="font-mono mt-0.5">
                      <span className="line-through text-stone-400 mr-1">
                        Bs {catalogPrice}
                      </span>
                      <strong className="text-emerald-700 font-bold text-sm">
                        Bs {finalPrice}
                      </strong>
                    </p>
                  ) : (
                    <p className="text-stone-400 italic">Elige un servicio</p>
                  )}
                </div>
              </div>

              {/* Fechas */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block font-medium text-stone-800 mb-1 text-xs">
                    Fecha inicio (opcional)
                  </label>
                  <input
                    type="date"
                    value={form.starts_at}
                    onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
                    className="w-full rounded-[4px] border border-stone-300 px-3 py-2 text-xs focus:outline-none focus:border-stone-900"
                  />
                </div>
                <div>
                  <label className="block font-medium text-stone-800 mb-1 text-xs">
                    Fecha fin (opcional)
                  </label>
                  <input
                    type="date"
                    value={form.ends_at}
                    onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
                    className="w-full rounded-[4px] border border-stone-300 px-3 py-2 text-xs focus:outline-none focus:border-stone-900"
                  />
                </div>
              </div>

              {/* Cupo máximo de reservas (BLOQUEADO si es Primera Visita) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-medium text-stone-800 text-xs">
                    Cupo máximo de reservas (opcional)
                  </label>
                  {form.promo_type === "first_visit" && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium text-amber-800 bg-amber-50 border border-amber-200 rounded-[4px] px-2 py-0.5">
                      <Lock size={10} />
                      Bloqueado: 1 uso por cliente
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  min={1}
                  value={form.promo_type === "first_visit" ? "" : form.max_uses}
                  disabled={form.promo_type === "first_visit"}
                  onChange={(e) => setForm({ ...form, max_uses: e.target.value })}
                  placeholder={
                    form.promo_type === "first_visit"
                      ? "Bloqueado: limitado a 1 por WhatsApp"
                      : "Vacío = sin límite"
                  }
                  className={`w-full rounded-[4px] border px-3.5 py-2 text-xs focus:outline-none transition-colors ${
                    form.promo_type === "first_visit"
                      ? "bg-stone-100 border-stone-200 text-stone-400 cursor-not-allowed select-none"
                      : "border-stone-300 focus:border-stone-900 bg-white"
                  }`}
                />
                {form.promo_type === "first_visit" && (
                  <p className="text-[11px] text-stone-400 mt-1">
                    En Primera Visita la regla estricta es 1 reserva con promo por número de teléfono; no se define cupo global.
                  </p>
                )}
              </div>

              {/* Activa en la web */}
              <div className="pt-2 border-t border-stone-100">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) => setForm({ ...form, active: e.target.checked })}
                    className="h-4 w-4 rounded-[4px] accent-stone-950"
                  />
                  <div>
                    <span className="font-medium text-stone-900 text-sm">
                      Activar promoción ahora
                    </span>
                    <p className="text-xs text-stone-500">
                      Al activarla, se desmarcarán automáticamente las demás promociones.
                    </p>
                  </div>
                </label>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setForm(null)}
                  className={buttonClasses("outline", "md")}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className={buttonClasses("dark", "md")}
                >
                  {saving ? (
                    <span className="flex items-center gap-2">
                      <Loader2 size={14} className="animate-spin" /> Guardando...
                    </span>
                  ) : form.id ? (
                    "Guardar cambios"
                  ) : (
                    "Crear promoción"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}