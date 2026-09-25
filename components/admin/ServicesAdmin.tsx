"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { showToast } from "./toast";
import type { Service } from "@/lib/types";

type FormState = {
  id: number | null;
  name: string;
  description: string;
  duration_minutes: string;
  price: string;
  image: string;
};

const EMPTY: FormState = {
  id: null,
  name: "",
  description: "",
  duration_minutes: "60",
  price: "",
  image: "",
};

export default function ServicesAdmin({ currency }: { currency: string }) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [showUrl, setShowUrl] = useState(false);
  const [urlValue, setUrlValue] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/services");
      const data = (await res.json()) as { services?: Service[] };
      if (data && Array.isArray(data.services)) {
        setServices(data.services);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    let active = true;
    fetch("/api/admin/services")
      .then((r) => r.json())
      .then((data: { services?: Service[] }) => {
        if (active && data && Array.isArray(data.services)) {
          setServices(data.services);
        }
      })
      .catch(() => {
        if (active) setServices([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function uploadImage(file: File) {
    if (!form) return;
    const MAX = 8 * 1024 * 1024;
    const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
    if (file.size > MAX) {
      const msg = "La imagen pesa más de 8 MB. Usa una foto más liviana.";
      setError(msg);
      showToast(msg, "error");
      return;
    }
    if (!ALLOWED.includes(file.type)) {
      const msg =
        "Formato no permitido (solo JPG, PNG, WEBP, GIF o SVG). Si es foto del celular, revisa que no sea HEIC.";
      setError(msg);
      showToast(msg, "error");
      return;
    }
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.error ?? "Error al subir la imagen.";
        setError(msg);
        showToast(msg, "error");
        return;
      }
      setForm({ ...form, image: data.url });
      setError("");
      showToast("Imagen subida", "success");
    } catch {
      const msg = "Error al subir la imagen. Intenta de nuevo.";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setUploading(false);
    }
  }

  async function openPicker() {
    if (!form || uploading) return;
    fileRef.current?.click();
  }

  function onFormPaste(e: React.ClipboardEvent) {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          uploadImage(file);
          e.preventDefault();
          return;
        }
      }
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setError("");
    setSaving(true);
    const body = JSON.stringify({
      name: form.name,
      description: form.description,
      duration_minutes: Number(form.duration_minutes),
      price: Number(form.price),
      image: form.image,
    });
    const res = form.id
      ? await fetch(`/api/admin/services/${form.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body,
        })
      : await fetch("/api/admin/services", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
        });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "Error al guardar.");
      return;
    }
    setForm(null);
    load();
    showToast(form.id ? "Servicio actualizado" : "Servicio creado", "success");
  }

  async function toggleActive(s: Service) {
    await fetch(`/api/admin/services/${s.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: s.name,
        description: s.description,
        duration_minutes: s.duration_minutes,
        price: s.price,
        image: s.image,
        active: !s.active,
      }),
    });
    load();
  }

  async function remove(id: number) {
    await fetch(`/api/admin/services/${id}`, { method: "DELETE" });
    setRemovingId(null);
    load();
    showToast("Servicio eliminado", "success");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-serif text-2xl text-stone-900">Servicios</h1>
        <button
          onClick={() => setForm({ ...EMPTY })}
          className="flex items-center gap-1.5 bg-brand hover:bg-rose-700 text-ink text-sm font-medium px-4 py-2.5 rounded-[4px] transition-colors"
        >
          <Plus size={16} />
          Nuevo servicio
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-rose-700" />
        </div>
      ) : services.length === 0 ? (
        <div className="bg-white rounded-[4px] border border-dashed border-stone-300 p-12 text-center">
          <p className="text-sm font-medium text-stone-700">No hay servicios registrados todavía</p>
          <p className="text-xs text-stone-400 mt-1 mb-4">Crea tu primer servicio para empezar a recibir reservas.</p>
          <button
            onClick={() => setForm({ ...EMPTY })}
            className="inline-flex items-center gap-1.5 bg-brand hover:bg-rose-700 text-ink text-xs font-semibold px-4 py-2.5 rounded-[4px] transition-colors"
          >
            <Plus size={14} />
            Crear primer servicio
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {services.map((s) => (
            <div
              key={s.id}
              className="bg-white rounded-[4px] border border-stone-200 p-4 flex flex-col sm:flex-row sm:items-center gap-3"
            >
              {s.image && (
                <img
                  src={s.image}
                  alt=""
                  className="h-12 w-12 rounded-[4px] object-cover shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-stone-900">
                  {s.name}
                  {!s.active && (
                    <span className="ml-2 text-xs text-stone-600 bg-stone-100 rounded-[4px] px-2 py-0.5">
                      Oculto
                    </span>
                  )}
                </p>
                {s.description && (
                  <p className="text-sm text-stone-500">{s.description}</p>
                )}
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <span className="text-sm text-stone-600">{s.duration_minutes} min</span>
                <span className="font-semibold text-accent">
                  {currency} {s.price}
                </span>
                <button
                  onClick={() => toggleActive(s)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-[4px] transition-colors ${
                    s.active ? "bg-accent" : "bg-stone-300"
                  }`}
                  aria-label={s.active ? "Ocultar servicio" : "Mostrar servicio"}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-[4px] bg-white transition-transform ${
                      s.active ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
                <button
                  onClick={() =>
                    setForm({
                      id: s.id,
                      name: s.name,
                      description: s.description,
                      duration_minutes: String(s.duration_minutes),
                      price: String(s.price),
                      image: s.image,
                    })
                  }
                  aria-label="Editar"
                  className="text-stone-500 hover:text-rose-700 transition-colors"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => setRemovingId(removingId === s.id ? null : s.id)}
                  aria-label="Eliminar"
                  className="text-stone-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              {removingId === s.id && (
                <div className="flex items-center justify-end gap-2 sm:col-span-2">
                  <span className="text-sm text-stone-600">¿Eliminar {s.name}?</span>
                  <button
                    onClick={() => remove(s.id)}
                    className="text-sm font-medium text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-[4px] transition-colors"
                  >
                    Sí, eliminar
                  </button>
                  <button
                    onClick={() => setRemovingId(null)}
                    className="text-sm font-medium text-stone-600 hover:text-stone-900 px-3 py-1.5 rounded-[4px] transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {form && (
        <div className="fixed inset-0 z-30 bg-stone-900/40 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-[4px] w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-xl text-stone-900">
                {form.id ? "Editar servicio" : "Nuevo servicio"}
              </h2>
              <button
                onClick={() => setForm(null)}
                aria-label="Cerrar"
                className="text-stone-500 hover:text-stone-700"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={save} onPaste={onFormPaste} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Nombre *
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-[4px] border border-stone-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Descripción
                </label>
                <input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full rounded-[4px] border border-stone-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Imagen
                </label>
                <div className="flex items-center gap-3">
                  {form.image ? (
                    <img
                      src={form.image}
                      alt="Vista previa"
                      className="h-16 w-16 rounded-[4px] object-cover"
                    />
                  ) : (
                    <label
                      htmlFor="service-image-input"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const file = e.dataTransfer.files?.[0];
                        if (file) uploadImage(file);
                      }}
                      aria-label="Subir imagen"
                      title="Clic o arrastra una imagen aquí"
                      className="h-16 w-16 rounded-[4px] border-2 border-dashed border-stone-300 flex items-center justify-center hover:border-rose-500 transition-colors cursor-pointer"
                    >
                      <ImagePlus size={20} className="text-stone-500" />
                    </label>
                  )}
                  <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={openPicker}
                        disabled={uploading}
                        className="text-sm font-medium text-white bg-brand hover:bg-rose-700 disabled:bg-stone-300 px-4 py-2 rounded-[4px] transition-colors"
                      >
                        {uploading ? "Subiendo…" : form.image ? "Cambiar imagen" : "Subir imagen"}
                      </button>
                      <input
                        id="service-image-input"
                        ref={fileRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                        className="sr-only"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) uploadImage(file);
                          e.target.value = "";
                        }}
                      />
                    </div>
                    {form.image && (
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, image: "" })}
                        className="text-sm text-stone-500 hover:text-red-600 text-left transition-colors"
                      >
                        Quitar imagen
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowUrl(true)}
                      className="text-sm text-stone-500 hover:text-accent text-left transition-colors"
                    >
                      Pegar URL de imagen
                    </button>
                    {showUrl && (
                      <div className="flex gap-2">
                        <input
                          type="url"
                          placeholder="https://…"
                          value={urlValue}
                          onChange={(e) => setUrlValue(e.target.value)}
                          className="w-full rounded-[4px] border border-stone-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (urlValue.trim()) {
                              setForm({ ...form, image: urlValue.trim() });
                              setShowUrl(false);
                              setUrlValue("");
                            }
                          }}
                          className="text-sm font-medium text-accent hover:text-accent-deep transition-colors shrink-0"
                        >
                          Usar
                        </button>
                      </div>
                    )}
                    <p className="text-[11px] text-stone-400">
                      También puedes arrastrar la imagen aquí o pegar con Ctrl+V.
                    </p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    Duración (min) *
                  </label>
                  <input
                    type="number"
                    min={15}
                    step={5}
                    value={form.duration_minutes}
                    onChange={(e) =>
                      setForm({ ...form, duration_minutes: e.target.value })
                    }
                    className="w-full rounded-[4px] border border-stone-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    Precio ({currency}) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="w-full rounded-[4px] border border-stone-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    required
                  />
                </div>
              </div>
              {error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-[4px] px-4 py-3">{error}</p>
              )}
              <button
                disabled={saving || uploading}
                className="w-full bg-brand hover:bg-rose-700 disabled:bg-stone-300 text-ink font-medium px-6 py-3 rounded-[4px] transition-colors"
              >
                {saving ? "Guardando…" : "Guardar"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}